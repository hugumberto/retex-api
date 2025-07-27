import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
} 