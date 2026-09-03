import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ILocalStorageService } from '../../../../app/services/local-storage/local-storage.service';
import { SERVICE_TOKENS } from '../../../../app/services/tokens';
import { CollectionRequestBag } from '../../../../domain/collection-request-bag/collection-request-bag.entity';
import { ICollectionRequestBagRepository } from '../../../../domain/collection-request-bag/collection-request-bag.repository';
import { DateRange } from '../../../../domain/dashboard/date-range';
import { BaseRepository } from '../abstraction/base.repository';
import { collectionRequestBagSchema } from './collection-request-bag.schema';

@Injectable()
export class CollectionRequestBagRepository
  extends BaseRepository<CollectionRequestBag>
  implements ICollectionRequestBagRepository
{
  constructor(
    @InjectRepository(collectionRequestBagSchema)
    collectionRequestBagRepository: Repository<CollectionRequestBag>,
    @Inject(SERVICE_TOKENS.LOCAL_STORAGE_SERVICE)
    localStorageService: ILocalStorageService,
  ) {
    super(collectionRequestBagRepository, localStorageService);
  }

  async countRequestsCollectedInRange(range: DateRange): Promise<number> {
    return this.countDistinctRequests('bag.used_at', range);
  }

  async countRequestsTriagedInRange(range: DateRange): Promise<number> {
    return this.countDistinctRequests('bag.processed_at', range);
  }

  /**
   * Solicitações distintas com pelo menos um saco cuja `column` cai no
   * intervalo. Sacos soltos (sem solicitação) não contam para nada aqui.
   *
   * O `to` é inclusivo — daí o `+ 1` e o `<`. Os parâmetros vão com CAST
   * explícito: sem ele o Postgres trata-os como `unknown` e escolhe o operador
   * errado na aritmética de datas.
   */
  private async countDistinctRequests(
    column: string,
    range: DateRange,
  ): Promise<number> {
    const repository = await this.getRepository();
    const queryBuilder: SelectQueryBuilder<CollectionRequestBag> = repository
      .createQueryBuilder('bag')
      .select('COUNT(DISTINCT bag.collection_request_id)', 'count')
      .where(`${column} IS NOT NULL`)
      .andWhere('bag.collection_request_id IS NOT NULL');

    if (range.from) {
      queryBuilder.andWhere(`${column} >= CAST(:from AS date)`, {
        from: range.from,
      });
    }
    if (range.to) {
      queryBuilder.andWhere(`${column} < CAST(:to AS date) + 1`, {
        to: range.to,
      });
    }

    const { count } = await queryBuilder.getRawOne<{ count: string }>();
    return Number(count);
  }

  async deleteExpiredUnused(olderThan: Date): Promise<number> {
    const repository = await this.getRepository();
    const result = await repository
      .createQueryBuilder()
      .delete()
      .where('used_at IS NULL')
      .andWhere('created_at < :olderThan', { olderThan })
      .execute();
    return result.affected ?? 0;
  }

  async findByRoute(routeId: string): Promise<CollectionRequestBag[]> {
    const repository = await this.getRepository();
    return repository
      .createQueryBuilder('collectionRequestBag')
      .where('collectionRequestBag.route_id = :routeId', { routeId })
      .orderBy('collectionRequestBag.createdAt', 'ASC')
      .getMany();
  }

  async deleteUnusedByRoute(routeId: string): Promise<number> {
    const repository = await this.getRepository();
    const result = await repository
      .createQueryBuilder()
      .delete()
      .where('route_id = :routeId', { routeId })
      .andWhere('used_at IS NULL')
      .execute();
    return result.affected ?? 0;
  }
}
