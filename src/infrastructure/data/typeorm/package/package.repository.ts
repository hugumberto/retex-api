import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Package } from '../../../../domain/package/package.entity';
import { IPackageRepository } from '../../../../domain/package/package.repository';
import { BaseRepository } from '../abstraction/base.repository';
import { packageSchema } from './package.schema';

@Injectable()
export class PackageRepository extends BaseRepository<Package> implements IPackageRepository {
  constructor(
    @InjectRepository(packageSchema)
    private readonly packageRepository: Repository<Package>,
  ) {
    super(packageRepository);
  }
} 