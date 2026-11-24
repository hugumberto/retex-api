import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { ILocalStorageService } from '../../../../app/services/local-storage/local-storage.service';
import { SERVICE_TOKENS } from '../../../../app/services/tokens';
import { DashboardScope } from '../../../../domain/collection-request/collection-request.repository';
import { DateRange } from '../../../../domain/dashboard/date-range';
import { Item } from '../../../../domain/item/item.entity';
import {
  IItemRepository,
  ItemBrandCount,
  ItemDimension,
  ItemDimensionCount,
  TriageQueueEntry,
} from '../../../../domain/item/item.repository';
import { BaseRepository } from '../abstraction/base.repository';
import { itemSchema } from './item.schema';
import { STATION_STALE_MINUTES } from '../../../../domain/triage-station/triage-station.entity';

@Injectable()
export class ItemRepository extends BaseRepository<Item> implements IItemRepository {
  constructor(
    @InjectRepository(itemSchema)
    itemRepository: Repository<Item>,
    @Inject(SERVICE_TOKENS.LOCAL_STORAGE_SERVICE)
    localStorageService: ILocalStorageService,
  ) {
    super(itemRepository, localStorageService);
  }

  async sumQuantityInRange(range: DateRange): Promise<number> {
    const repository = await this.getRepository();
    const queryBuilder = repository
      .createQueryBuilder('item')
      // Peças, e não linhas de item: cada lançamento traz uma quantidade.
      .select('COALESCE(SUM(item.quantity), 0)', 'total');

    if (range.from) {
      queryBuilder.andWhere('item.created_at >= CAST(:from AS date)', {
        from: range.from,
      });
    }
    if (range.to) {
      queryBuilder.andWhere('item.created_at < CAST(:to AS date) + 1', {
        to: range.to,
      });
    }

    const { total } = await queryBuilder.getRawOne<{ total: string }>();
    return Number(total);
  }

  async findByIds(ids: string[]): Promise<Item[]> {
    const repository = await this.getRepository();
    return repository.find({
      where: { id: In(ids) },
      relations: ['collectionRequest', 'brand', 'storageUnit'],
    });
  }

  async findByCollectionRequestId(collectionRequestId: string): Promise<Item[]> {
    const repository = await this.getRepository();
    return repository.find({
      where: { collectionRequest: { id: collectionRequestId } },
      relations: ['collectionRequest', 'brand', 'storageUnit'],
    });
  }

  async triageQueue(limit: number): Promise<TriageQueueEntry[]> {
    const repository = await this.getRepository();
    const rows: {
      id: string; code: string | null; status: string; client_name: string | null;
      bags: string; bags_processed: string; collected_at: Date | null;
      assigned_station: number | null; open_station: number | null;
    }[] = await repository.manager.query(
      `SELECT cr.id, cr.friendly_code AS code, cr.status,
              COALESCE(c.name, NULLIF(TRIM(CONCAT(u.first_name, ' ', u.last_name)), '')) AS client_name,
              COUNT(b.id) AS bags,
              COUNT(b.processed_at) AS bags_processed,
              MIN(b.used_at) AS collected_at,
              (SELECT ts.number FROM triage_station ts
                WHERE ts.assigned_request_id = cr.id AND ts.deleted_at IS NULL LIMIT 1) AS assigned_station,
              (SELECT ts.number FROM triage_station ts
                WHERE ts.collection_request_id = cr.id AND ts.deleted_at IS NULL
                  AND ts.last_seen_at > now() - make_interval(mins => $2) LIMIT 1) AS open_station
         FROM collection_request cr
         LEFT JOIN company c ON c.id = cr.company_id
         LEFT JOIN "user" u ON u.id = cr.user_id
         LEFT JOIN collection_request_bag b ON b.collection_request_id = cr.id AND b.deleted_at IS NULL
        WHERE cr.deleted_at IS NULL
          AND cr.status IN ('COLLECTED', 'IN_HOUSE', 'SCREENING')
        GROUP BY cr.id, c.name, u.first_name, u.last_name
        ORDER BY (cr.status = 'SCREENING') DESC, MIN(b.used_at) ASC NULLS LAST, cr.created_at ASC
        LIMIT $1`,
      [limit, STATION_STALE_MINUTES],
    );
    return rows.map((r) => ({
      id: r.id,
      code: r.code,
      status: r.status,
      clientName: r.client_name,
      bags: Number(r.bags),
      bagsProcessed: Number(r.bags_processed),
      collectedAt: r.collected_at,
      assignedStation: r.assigned_station,
      openStation: r.open_station,
    }));
  }

  async operatorStats(operatorId: string, since: Date): Promise<{ pieces: number; requests: number }> {
    const repository = await this.getRepository();
    const [row]: { pieces: string; requests: string }[] = await repository.manager.query(
      `SELECT COALESCE(SUM(quantity), 0) AS pieces, COUNT(DISTINCT collection_request_id) AS requests
         FROM item
        WHERE deleted_at IS NULL AND operator_id = $1 AND created_at >= $2
          AND destination <> 'ACCESSORY'`,
      [operatorId, since],
    );
    return { pieces: Number(row.pieces), requests: Number(row.requests) };
  }

  async topCategories(limit: number): Promise<string[]> {
    const repository = await this.getRepository();
    const rows: { category: string }[] = await repository.manager.query(
      `SELECT category FROM item
        WHERE deleted_at IS NULL AND category IS NOT NULL
        GROUP BY category
        ORDER BY SUM(quantity) DESC
        LIMIT $1`,
      [limit],
    );
    return rows.map((r) => r.category);
  }

  async countByBagId(bagId: string): Promise<number> {
    const repository = await this.getRepository();
    // `count` ignora itens soft-deleted, que é o que se quer: um saco a que
    // removeram todos os itens está tão vazio como um que nunca teve nenhum.
    return repository.count({ where: { bag: { id: bagId } } });
  }

  /**
   * Restringe uma agregação de itens a uma empresa ou a um utilizador.
   *
   * A tabela `item` não tem `company_id` nem `user_id`: só lá chega pela
   * solicitação a que pertence, daí o join. É `innerJoin` porque todo o item
   * pertence a uma solicitação, e sem âmbito nem sequer se junta — assim a
   * vista de ADMIN continua a correr exatamente a mesma consulta de antes.
   */
  private applyScope<T>(
    queryBuilder: SelectQueryBuilder<T>,
    scope?: DashboardScope,
  ): SelectQueryBuilder<T> {
    // Período: nas peças conta a data da triagem (criação do item).
    if (scope?.from) {
      queryBuilder.andWhere('item.created_at >= CAST(:itemFrom AS date)', {
        itemFrom: scope.from,
      });
    }
    if (scope?.to) {
      queryBuilder.andWhere(
        "item.created_at < CAST(:itemTo AS date) + interval '1 day'",
        { itemTo: scope.to },
      );
    }
    if (!scope?.companyId && !scope?.userId && !scope?.city) {
      return queryBuilder;
    }

    queryBuilder.innerJoin('item.collectionRequest', 'collectionRequest');
    if (scope.city) {
      queryBuilder.andWhere(
        'collectionRequest.address_id IN (SELECT a.id FROM user_address a WHERE LOWER(TRIM(a.city)) = LOWER(TRIM(:scopeCity)))',
        { scopeCity: scope.city },
      );
    }
    if (scope.companyId) {
      queryBuilder.andWhere('collectionRequest.company_id = :scopeCompanyId', {
        scopeCompanyId: scope.companyId,
      });
    }
    if (scope.userId) {
      queryBuilder.andWhere('collectionRequest.user_id = :scopeUserId', {
        scopeUserId: scope.userId,
      });
    }
    return queryBuilder;
  }

  async aggregateBy(
    dimension: ItemDimension,
    scope?: DashboardScope,
  ): Promise<ItemDimensionCount[]> {
    const repository = await this.getRepository();
    // Whitelist runtime: nunca interpolar `dimension` no SQL sem validar, pois o
    // tipo é apagado em runtime (defesa contra valores inválidos / injeção).
    const columns: Record<ItemDimension, string> = {
      condition: 'condition',
      destination: 'destination',
      category: 'category',
      season: 'season',
      type: 'type',
    };
    const column = columns[dimension];
    if (!column) {
      throw new Error(`Dimensão de item inválida: ${dimension}`);
    }
    const rows = await this.applyScope(
      repository
        .createQueryBuilder('item')
        .select(`item.${column}`, 'key')
        .addSelect('COUNT(*)', 'count')
        .addSelect('COALESCE(SUM(item.quantity), 0)', 'quantity'),
      scope,
    )
      .groupBy(`item.${column}`)
      .getRawMany<{ key: string; count: string; quantity: string }>();

    return rows.map((row) => ({
      key: row.key,
      count: Number(row.count),
      quantity: Number(row.quantity),
    }));
  }

  async aggregateByBrand(scope?: DashboardScope): Promise<ItemBrandCount[]> {
    const repository = await this.getRepository();
    const rows = await this.applyScope(
      repository
        .createQueryBuilder('item')
        .leftJoin('item.brand', 'brand')
        .select("COALESCE(brand.name, 'Sem marca')", 'brand')
        .addSelect('COUNT(*)', 'count')
        .addSelect('COALESCE(SUM(item.quantity), 0)', 'quantity'),
      scope,
    )
      .groupBy('brand.name')
      .orderBy('COUNT(*)', 'DESC')
      .getRawMany<{ brand: string; count: string; quantity: string }>();

    return rows.map((row) => ({
      brand: row.brand,
      count: Number(row.count),
      quantity: Number(row.quantity),
    }));
  }
}