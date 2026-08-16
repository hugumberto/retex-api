import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { ILocalStorageService } from '../../../../app/services/local-storage/local-storage.service';
import { SERVICE_TOKENS } from '../../../../app/services/tokens';
import { DashboardScope } from '../../../../domain/collection-request/collection-request.repository';
import { Item } from '../../../../domain/item/item.entity';
import {
  IItemRepository,
  ItemBrandCount,
  ItemDimension,
  ItemDimensionCount,
} from '../../../../domain/item/item.repository';
import { BaseRepository } from '../abstraction/base.repository';
import { itemSchema } from './item.schema';

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
    if (!scope?.companyId && !scope?.userId) {
      return queryBuilder;
    }

    queryBuilder.innerJoin('item.collectionRequest', 'collectionRequest');
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
      quality: 'quality',
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