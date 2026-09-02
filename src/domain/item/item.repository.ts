import { DashboardScope } from '../collection-request/collection-request.repository';
import { IRepository } from '../interfaces/repository.interface';
import { Item } from './item.entity';

export type ItemDimension = 'quality' | 'season' | 'type';

export interface ItemDimensionCount {
  key: string;
  count: number;
  quantity: number;
}

export interface ItemBrandCount {
  brand: string;
  count: number;
  quantity: number;
}

export interface IItemRepository extends IRepository<Item> {
  findByIds(ids: string[]): Promise<Item[]>;
  findByCollectionRequestId(collectionRequestId: string): Promise<Item[]>;
  /** Quantos itens estão atribuídos a um saco. Usado para impedir fechar um saco vazio. */
  countByBagId(bagId: string): Promise<number>;

  // Agregações para o dashboard (somente leitura). Sem `scope` agregam tudo.
  aggregateBy(
    dimension: ItemDimension,
    scope?: DashboardScope,
  ): Promise<ItemDimensionCount[]>;
  aggregateByBrand(scope?: DashboardScope): Promise<ItemBrandCount[]>;
}