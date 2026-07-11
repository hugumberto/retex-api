import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ILocalStorageService } from '../../../../app/services/local-storage/local-storage.service';
import { SERVICE_TOKENS } from '../../../../app/services/tokens';
import { StorageUnit } from '../../../../domain/storage-unit/storage-unit.entity';
import { IStorageUnitRepository } from '../../../../domain/storage-unit/storage-unit.repository';
import { BaseRepository } from '../abstraction/base.repository';
import { storageUnitSchema } from './storage-unit.schema';

@Injectable()
export class StorageUnitRepository extends BaseRepository<StorageUnit> implements IStorageUnitRepository {
  constructor(
    @InjectRepository(storageUnitSchema)
    storageUnitRepository: Repository<StorageUnit>,
    @Inject(SERVICE_TOKENS.LOCAL_STORAGE_SERVICE)
    localStorageService: ILocalStorageService,
  ) {
    super(storageUnitRepository, localStorageService);
  }

  async findOneWithBrand(query: Partial<StorageUnit>): Promise<StorageUnit> {
    const repository = await this.getRepository();
    return repository.findOne({
      where: this.buildWhereClause(query) as any,
    });
  }

  async findAllWithBrand(query: Partial<StorageUnit>): Promise<StorageUnit[]> {
    const repository = await this.getRepository();
    return repository.find({
      where: this.buildWhereClause(query) as any,
    });
  }

  async findByIds(ids: string[]): Promise<StorageUnit[]> {
    const repository = await this.getRepository();
    return repository.find({
      where: { id: In(ids) },
    });
  }

  private buildWhereClause(query: Partial<StorageUnit>): Record<string, any> {
    const whereClause = {};

    for (const [key, value] of Object.entries(query)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        for (const [nestedKey, nestedValue] of Object.entries(value)) {
          whereClause[`${key}_${this.convertToSnakeCase(nestedKey)}`] = nestedValue;
        }
      } else {
        whereClause[this.convertToSnakeCase(key)] = value;
      }
    }

    return whereClause;
  }

  private convertToSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace(/^_/, '');
  }
} 