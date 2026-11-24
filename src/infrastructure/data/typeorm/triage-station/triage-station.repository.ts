import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { ILocalStorageService } from '../../../../app/services/local-storage/local-storage.service';
import { SERVICE_TOKENS } from '../../../../app/services/tokens';
import {
  PendingLot,
  TriageEvent,
  TriageStation,
  TriageStationStatus,
} from '../../../../domain/triage-station/triage-station.entity';
import {
  ITriageStationRepository,
  TriageDayStats,
  TriageExportRow,
  TriageStationRow,
} from '../../../../domain/triage-station/triage-station.repository';
import { BaseRepository } from '../abstraction/base.repository';
import { triageEventSchema, triageStationSchema } from './triage-station.schema';

const CLIENT_NAME = `COALESCE(c.name, NULLIF(TRIM(CONCAT(cu.first_name, ' ', cu.last_name)), ''))`;

@Injectable()
export class TriageStationRepository
  extends BaseRepository<TriageStation>
  implements ITriageStationRepository
{
  constructor(
    @InjectRepository(triageStationSchema)
    repository: Repository<TriageStation>,
    @InjectRepository(triageEventSchema)
    private readonly eventRepository: Repository<TriageEvent>,
    @Inject(SERVICE_TOKENS.LOCAL_STORAGE_SERVICE)
    localStorageService: ILocalStorageService,
  ) {
    super(repository, localStorageService);
  }

  private async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    const repository = await this.getRepository();
    return repository.manager.query(sql, params);
  }

  async findByNumber(number: number): Promise<TriageStation | null> {
    const repository = await this.getRepository();
    return repository.findOne({ where: { number } });
  }

  async releaseOperator(operatorId: string, keep: number): Promise<void> {
    await this.query(
      `UPDATE triage_station
          SET operator_id = NULL, collection_request_id = NULL, status = 'FREE',
              session_started_at = NULL, pending_lots = NULL, updated_at = now()
        WHERE operator_id = $1 AND number <> $2`,
      [operatorId, keep],
    );
  }

  async clearAssignment(collectionRequestId: string, keep?: number): Promise<void> {
    await this.query(
      `UPDATE triage_station SET assigned_request_id = NULL, updated_at = now()
        WHERE assigned_request_id = $1 AND ($2::int IS NULL OR number <> $2)`,
      [collectionRequestId, keep ?? null],
    );
  }

  async rows(rhythmSince: Date): Promise<TriageStationRow[]> {
    const rows = await this.query<{
      number: number; status: TriageStationStatus; last_seen_at: Date | null; session_started_at: Date | null;
      operator_id: string | null; operator_name: string | null; pending_lots: PendingLot[] | null;
      req_id: string | null; req_code: string | null; client_name: string | null;
      bags: string; bags_processed: string; pieces: string;
      assigned_id: string | null; assigned_code: string | null; recent_pieces: string;
    }>(
      `SELECT ts.number, ts.status, ts.last_seen_at, ts.session_started_at, ts.operator_id, ts.pending_lots,
              NULLIF(TRIM(CONCAT(op.first_name, ' ', op.last_name)), '') AS operator_name,
              cr.id AS req_id, cr.friendly_code AS req_code, ${CLIENT_NAME} AS client_name,
              (SELECT COUNT(*) FROM collection_request_bag b
                WHERE b.collection_request_id = cr.id AND b.deleted_at IS NULL) AS bags,
              (SELECT COUNT(b.processed_at) FROM collection_request_bag b
                WHERE b.collection_request_id = cr.id AND b.deleted_at IS NULL) AS bags_processed,
              (SELECT COALESCE(SUM(i.quantity), 0) FROM item i
                WHERE i.collection_request_id = cr.id AND i.deleted_at IS NULL) AS pieces,
              ar.id AS assigned_id, ar.friendly_code AS assigned_code,
              (SELECT COALESCE(SUM(i.quantity), 0) FROM item i
                WHERE i.deleted_at IS NULL AND i.station = ts.number AND i.operator_id = ts.operator_id
                  AND i.destination <> 'ACCESSORY'
                  AND i.created_at >= GREATEST($1, COALESCE(ts.session_started_at, $1))) AS recent_pieces
         FROM triage_station ts
         LEFT JOIN "user" op ON op.id = ts.operator_id
         LEFT JOIN collection_request cr ON cr.id = ts.collection_request_id AND cr.deleted_at IS NULL
         LEFT JOIN company c ON c.id = cr.company_id
         LEFT JOIN "user" cu ON cu.id = cr.user_id
         LEFT JOIN collection_request ar ON ar.id = ts.assigned_request_id AND ar.deleted_at IS NULL
        WHERE ts.deleted_at IS NULL
        ORDER BY ts.number`,
      [rhythmSince],
    );
    return rows.map((r) => ({
      number: r.number,
      status: r.status,
      lastSeenAt: r.last_seen_at,
      sessionStartedAt: r.session_started_at,
      operatorId: r.operator_id,
      operatorName: r.operator_name,
      request: r.req_id
        ? {
            id: r.req_id,
            code: r.req_code,
            clientName: r.client_name,
            bags: Number(r.bags),
            bagsProcessed: Number(r.bags_processed),
            pieces: Number(r.pieces),
          }
        : null,
      assigned: r.assigned_id ? { id: r.assigned_id, code: r.assigned_code } : null,
      pendingLots: r.pending_lots ?? [],
      recentPieces: Number(r.recent_pieces),
    }));
  }

  async dayStats(since: Date): Promise<TriageDayStats> {
    const [[pieces], [weight], [done], destinations] = await Promise.all([
      this.query<{ pieces: string; accessories: string }>(
        `SELECT COALESCE(SUM(quantity) FILTER (WHERE destination <> 'ACCESSORY'), 0) AS pieces,
                COALESCE(SUM(quantity) FILTER (WHERE destination = 'ACCESSORY'), 0) AS accessories
           FROM item WHERE deleted_at IS NULL AND created_at >= $1`,
        [since],
      ),
      this.query<{ weight: string; pieces: string }>(
        `WITH bags AS (
           SELECT id, weight FROM collection_request_bag
            WHERE deleted_at IS NULL AND processed_at >= $1 AND weight > 0
         )
         SELECT (SELECT COALESCE(SUM(weight), 0) FROM bags) AS weight,
                (SELECT COALESCE(SUM(quantity), 0) FROM item
                  WHERE deleted_at IS NULL AND destination <> 'ACCESSORY'
                    AND collection_request_bag_id IN (SELECT id FROM bags)) AS pieces`,
        [since],
      ),
      this.query<{ requests: string; last_done_at: Date | null }>(
        `SELECT COUNT(*) AS requests, MAX(updated_at) AS last_done_at
           FROM collection_request
          WHERE deleted_at IS NULL AND status = 'STOCKED' AND updated_at >= $1`,
        [since],
      ),
      this.query<{ destination: string; pieces: string }>(
        `SELECT destination, SUM(quantity) AS pieces FROM item
          WHERE deleted_at IS NULL AND created_at >= $1
          GROUP BY destination`,
        [since],
      ),
    ]);
    return {
      pieces: Number(pieces.pieces),
      accessories: Number(pieces.accessories),
      weight: Number(weight.weight),
      piecesOfWeighedBags: Number(weight.pieces),
      requestsDone: Number(done.requests),
      lastDoneAt: done.last_done_at,
      destinations: destinations.map((d) => ({ destination: d.destination, pieces: Number(d.pieces) })),
    };
  }

  async averageDailyPieces(today: Date, days: number): Promise<number | null> {
    const [row] = await this.query<{ avg: string | null }>(
      `SELECT AVG(pieces) AS avg FROM (
         SELECT (created_at AT TIME ZONE 'Europe/Lisbon')::date AS day, SUM(quantity) AS pieces
           FROM item
          WHERE deleted_at IS NULL AND destination <> 'ACCESSORY'
            AND created_at < $1 AND created_at >= $1 - interval '90 days'
          GROUP BY 1 ORDER BY 1 DESC LIMIT $2
       ) d`,
      [today, days],
    );
    return row?.avg === null || row?.avg === undefined ? null : Number(row.avg);
  }

  async exportRows(since: Date, until: Date): Promise<TriageExportRow[]> {
    const rows = await this.query<{
      created_at: Date; station: number | null; operator_name: string | null; request_code: string | null;
      client_name: string | null; bag_code: string | null; quantity: number; destination: string;
      category: string | null; condition: string | null; sex: string | null; age_group: string | null;
      season: string | null; brand: string | null; storage_unit_code: string | null;
    }>(
      `SELECT i.created_at, i.station, NULLIF(TRIM(CONCAT(op.first_name, ' ', op.last_name)), '') AS operator_name,
              cr.friendly_code AS request_code, ${CLIENT_NAME} AS client_name, b.friendly_code AS bag_code,
              i.quantity, i.destination, i.category, i.condition, i.sex, i.age_group, i.season,
              br.name AS brand, su.friendly_code AS storage_unit_code
         FROM item i
         LEFT JOIN "user" op ON op.id = i.operator_id
         LEFT JOIN collection_request cr ON cr.id = i.collection_request_id
         LEFT JOIN company c ON c.id = cr.company_id
         LEFT JOIN "user" cu ON cu.id = cr.user_id
         LEFT JOIN collection_request_bag b ON b.id = i.collection_request_bag_id
         LEFT JOIN brand br ON br.id = i.brand_id
         LEFT JOIN storage_unit su ON su.id = i.storage_unit_id
        WHERE i.deleted_at IS NULL AND i.created_at >= $1 AND i.created_at < $2
        ORDER BY i.created_at`,
      [since, until],
    );
    return rows.map((r) => ({
      createdAt: r.created_at,
      station: r.station,
      operatorName: r.operator_name,
      requestCode: r.request_code,
      clientName: r.client_name,
      bagCode: r.bag_code,
      quantity: r.quantity,
      destination: r.destination,
      category: r.category,
      condition: r.condition,
      sex: r.sex,
      ageGroup: r.age_group,
      season: r.season,
      brand: r.brand,
      storageUnitCode: r.storage_unit_code,
    }));
  }

  async recordEvent(event: Omit<TriageEvent, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<void> {
    await this.eventRepository.save(this.eventRepository.create(event));
  }

  async eventsSince(since: Date, limit: number): Promise<TriageEvent[]> {
    return this.eventRepository.find({
      where: { createdAt: MoreThanOrEqual(since) },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
