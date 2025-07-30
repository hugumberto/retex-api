import { Inject, Injectable } from '@nestjs/common';
import { Brand } from '../../../../domain/brand/brand.entity';
import { IBrandRepository } from '../../../../domain/brand/brand.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

@Injectable()
export class GetAllBrandsUseCase implements IUseCase<void, Brand[]> {
  constructor(
    @Inject(DOMAIN_TOKENS.BRAND_REPOSITORY)
    private readonly brandRepository: IBrandRepository,
  ) { }

  async call(): Promise<Brand[]> {
    return this.brandRepository.find({});
  }
} 