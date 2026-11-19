import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ILocalStorageService } from '../../../../app/services/local-storage/local-storage.service';
import { SERVICE_TOKENS } from '../../../../app/services/tokens';
import { StorageZone } from '../../../../domain/storage-unit/storage-unit.entity';
import {
  OutboundStatus,
  WarehouseOutbound,
} from '../../../../domain/warehouse/warehouse-outbound.entity';
import {
  IWarehouseOutboundRepository,
  ReceptionRow,
  SortingStock,
  ZoneStock,
} from '../../../../domain/warehouse/warehouse.repository';
import { BaseRepository } from '../abstraction/base.repository';
import { warehouseOutboundSchema } from './warehouse-outbound.schema';

// Estados em que um pedido recebido ainda tem sacos à espera de triagem.
const SORTING_STATUSES = ['COLLECTED', 'IN_HOUSE', 'SCREENING'];

@Injectable()
export class WarehouseOutboundRepository
  extends BaseRepository<WarehouseOutbound>
  implements IWarehouseOutboundRepository
{
  constructor(
    @InjectRepository(warehouseOutboundSchema)
    repository: Repository<WarehouseOutbound>,
    @Inject(SERVICE_TOKENS.LOCAL_STORAGE_SERVICE)
    localStorageService: ILocalStorageService,
  ) {
    super(repository, localStorageService);
  }

  private async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    const repository = await this.getRepository();
    return repository.manager.query(sql, params);
  }

  async findWithUnits(id: string): Promise<WarehouseOutbound | null> {
    const outbound = await this.findOne({ id });
    if (!outbound) return null;
    const [withUnits] = await this.attachUnits([outbound]);
    return withUnits;
  }

  async findScheduled(): Promise<WarehouseOutbound[]> {
    const repository = await this.getRepository();
    const list = await repository.find({
      where: { status: OutboundStatus.SCHEDULED },
      order: { scheduledDate: 'ASC', createdAt: 'ASC' },
    });
    return this.attachUnits(list);
  }

  private async attachUnits(list: WarehouseOutbound[]): Promise<WarehouseOutbound[]> {
    if (list.length === 0) return list;
    const rows = await this.query<{ id: string; outbound_id: string; friendly_code: string | null; storage_group: string; zone: string | null; weight: string; items_count: number }>(
      `SELECT id, outbound_id, friendly_code, storage_group, zone, weight, items_count
         FROM storage_unit
        WHERE outbound_id = ANY($1) AND deleted_at IS NULL`,
      [list.map((o) => o.id)],
    );
    return list.map((o) => ({
      ...o,
      storageUnits: rows
        .filter((r) => r.outbound_id === o.id)
        .map((r) => ({
          id: r.id,
          friendlyCode: r.friendly_code,
          group: r.storage_group,
          zone: r.zone,
          weight: Number(r.weight),
          itemsCount: r.items_count,
        })) as WarehouseOutbound['storageUnits'],
    }));
  }

  async setUnits(outboundId: string, storageUnitIds: string[]): Promise<void> {
    await this.query(`UPDATE storage_unit SET outbound_id = NULL WHERE outbound_id = $1`, [outboundId]);
    if (storageUnitIds.length > 0) {
      await this.query(`UPDATE storage_unit SET outbound_id = $1 WHERE id = ANY($2)`, [
        outboundId,
        storageUnitIds,
      ]);
    }
  }

  async sortingStock(): Promise<SortingStock> {
    const [row] = await this.query<{ weight: string; bags: string }>(
      `SELECT COALESCE(SUM(b.received_weight), 0) AS weight, COUNT(*) AS bags
         FROM collection_request_bag b
         JOIN collection_request cr ON cr.id = b.collection_request_id AND cr.deleted_at IS NULL
        WHERE b.deleted_at IS NULL
          AND b.received_at IS NOT NULL
          AND b.processed_at IS NULL
          AND cr.status = ANY($1)`,
      [SORTING_STATUSES],
    );
    return { weight: Number(row.weight), bags: Number(row.bags) };
  }

  async zoneStock(): Promise<ZoneStock[]> {
    const rows = await this.query<{ zone: StorageZone; weight: string; pieces_without_weight: string; pieces: string }>(
      `SELECT COALESCE(zone::text, CASE WHEN storage_group = 'NON_REUSABLE' THEN 'RECYCLING' ELSE 'REUSE' END) AS zone,
              COALESCE(SUM(weight), 0) AS weight,
              COALESCE(SUM(CASE WHEN weight > 0 THEN 0 ELSE items_count END), 0) AS pieces_without_weight,
              COALESCE(SUM(items_count), 0) AS pieces
         FROM storage_unit
        WHERE status = 'ATIVO' AND deleted_at IS NULL
        GROUP BY 1`,
    );
    return rows.map((r) => ({
      zone: r.zone,
      weight: Number(r.weight),
      piecesWithoutWeight: Number(r.pieces_without_weight),
      pieces: Number(r.pieces),
    }));
  }

  async averageKgPerPiece(): Promise<number | null> {
    const [row] = await this.query<{ kg: string | null }>(
      `WITH triaged AS (
         SELECT id, weight FROM collection_request
          WHERE status IN ('SCREENING', 'STOCKED') AND weight > 0 AND deleted_at IS NULL
       )
       SELECT (SELECT SUM(weight) FROM triaged)
              / NULLIF((SELECT SUM(quantity) FROM item
                         WHERE deleted_at IS NULL
                           AND collection_request_id IN (SELECT id FROM triaged)), 0) AS kg`,
    );
    return row?.kg === null || row?.kg === undefined ? null : Number(row.kg);
  }

  async receptionsOn(date: string): Promise<ReceptionRow[]> {
    const rows = await this.query<{
      id: string; code: string | null; city: string | null; route_code: string | null;
      received_at: Date; bags_linked: string; bags_received: string; weight: string; status: string;
    }>(
      `SELECT cr.id, cr.friendly_code AS code, a.city, r.friendly_code AS route_code,
              MAX(b.received_at) AS received_at,
              COUNT(b.id) AS bags_linked,
              COUNT(b.received_at) AS bags_received,
              COALESCE(SUM(b.received_weight), 0) AS weight,
              cr.status
         FROM collection_request cr
         JOIN collection_request_bag b ON b.collection_request_id = cr.id AND b.deleted_at IS NULL
         LEFT JOIN user_address a ON a.id = cr.address_id
         LEFT JOIN route r ON r.id = cr.route_id
        WHERE cr.deleted_at IS NULL
          AND cr.id IN (
            SELECT collection_request_id FROM collection_request_bag
             WHERE deleted_at IS NULL
               AND (received_at AT TIME ZONE 'Europe/Lisbon')::date = $1::date)
        GROUP BY cr.id, a.city, r.friendly_code
        ORDER BY received_at DESC`,
      [date],
    );
    return rows.map((r) => ({
      collectionRequestId: r.id,
      code: r.code,
      city: r.city,
      routeCode: r.route_code,
      receivedAt: r.received_at,
      bagsLinked: Number(r.bags_linked),
      bagsReceived: Number(r.bags_received),
      weight: Number(r.weight),
      status: r.status,
    }));
  }
}
