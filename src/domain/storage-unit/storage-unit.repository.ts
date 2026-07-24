import { IRepository } from '../interfaces/repository.interface';
import { StorageUnit } from './storage-unit.entity';

export interface IStorageUnitRepository extends IRepository<StorageUnit> {
  findOneWithBrand(query: Partial<StorageUnit>): Promise<StorageUnit>;
  findAllWithBrand(query: Partial<StorageUnit>): Promise<StorageUnit[]>;
  findByIds(ids: string[]): Promise<StorageUnit[]>;
  // Ajusta o contador denormalizado de itens (delta pode ser negativo).
  incrementItemsCount(storageUnitId: string, delta: number): Promise<void>;
}