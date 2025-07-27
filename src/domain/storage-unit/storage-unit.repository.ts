import { IRepository } from '../interfaces/repository.interface';
import { StorageUnit } from './storage-unit.entity';

export interface IStorageUnitRepository extends IRepository<StorageUnit> {
  findOneWithBrand(query: Partial<StorageUnit>): Promise<StorageUnit>;
  findAllWithBrand(query: Partial<StorageUnit>): Promise<StorageUnit[]>;
} 