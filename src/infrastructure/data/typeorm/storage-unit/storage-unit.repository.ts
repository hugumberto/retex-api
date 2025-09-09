import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { StorageUnit } from '../../../../domain/storage-unit/storage-unit.entity';
import { IStorageUnitRepository } from '../../../../domain/storage-unit/storage-unit.repository';
import { BaseRepository } from '../abstraction/base.repository';
import { storageUnitSchema } from './storage-unit.schema';

@Injectable()
export class StorageUnitRepository extends BaseRepository<StorageUnit> implements IStorageUnitRepository {
  constructor(
    @InjectRepository(storageUnitSchema)
    private readonly storageUnitRepository: Repository<StorageUnit>,
  ) {
    super(storageUnitRepository);
  }

  async findOneWithBrand(query: Partial<StorageUnit>): Promise<StorageUnit> {
    return this.storageUnitRepository.findOne({
      where: this.buildWhereClause(query) as any,
      relations: ['brand'],
    });
  }

  async findAllWithBrand(query: Partial<StorageUnit>): Promise<StorageUnit[]> {
    return this.storageUnitRepository.find({
      where: this.buildWhereClause(query) as any,
      relations: ['brand'],
    });
  }

  async findByIds(ids: string[]): Promise<StorageUnit[]> {
    return this.storageUnitRepository.find({
      where: { id: In(ids) },
      relations: ['brand'],
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