import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from '../../../../domain/brand/brand.entity';
import { IBrandRepository } from '../../../../domain/brand/brand.repository';
import { BaseRepository } from '../abstraction/base.repository';
import { brandSchema } from './brand.schema';

@Injectable()
export class BrandRepository extends BaseRepository<Brand> implements IBrandRepository {
  constructor(
    @InjectRepository(brandSchema)
    private readonly brandRepository: Repository<Brand>,
  ) {
    super(brandRepository);
  }
} 