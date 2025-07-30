import { Inject, Injectable } from '@nestjs/common';
import { Brand } from '../../../../domain/brand/brand.entity';
import { IBrandRepository } from '../../../../domain/brand/brand.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

@Injectable()
export class GetBrandByIdUseCase implements IUseCase<string, Brand> {
  constructor(
    @Inject(DOMAIN_TOKENS.BRAND_REPOSITORY)
    private readonly brandRepository: IBrandRepository,
  ) { }

  async call(id: string): Promise<Brand> {
    const brand = await this.brandRepository.findOne({ id });

    if (!brand) {
      throw new Error('Marca não encontrada');
    }

    return brand;
  }
} 