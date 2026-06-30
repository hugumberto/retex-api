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
  findByPackageId(packageId: string): Promise<Item[]>;

  // Agregações para o dashboard (somente leitura).
  aggregateBy(dimension: ItemDimension): Promise<ItemDimensionCount[]>;
  aggregateByBrand(): Promise<ItemBrandCount[]>;
}