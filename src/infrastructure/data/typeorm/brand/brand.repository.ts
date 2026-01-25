import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ILocalStorageService } from '../../../../app/services/local-storage/local-storage.service';
import { SERVICE_TOKENS } from '../../../../app/services/tokens';
import { Brand } from '../../../../domain/brand/brand.entity';
import { IBrandRepository } from '../../../../domain/brand/brand.repository';
import { BaseRepository } from '../abstraction/base.repository';
import { brandSchema } from './brand.schema';

@Injectable()
export class BrandRepository extends BaseRepository<Brand> implements IBrandRepository {
  constructor(
    @InjectRepository(brandSchema)
    brandRepository: Repository<Brand>,
    @Inject(SERVICE_TOKENS.LOCAL_STORAGE_SERVICE)
    localStorageService: ILocalStorageService,
  ) {
    super(brandRepository, localStorageService);
  }
} 