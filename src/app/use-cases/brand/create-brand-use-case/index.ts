import { Inject, Injectable } from '@nestjs/common';
import { Brand } from '../../../../domain/brand/brand.entity';
import { IBrandRepository } from '../../../../domain/brand/brand.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { CreateBrandDto } from './create-brand.dto';

export { CreateBrandDto };

@Injectable()
export class CreateBrandUseCase implements IUseCase<CreateBrandDto, Brand> {
  constructor(
    @Inject(DOMAIN_TOKENS.BRAND_REPOSITORY)
    private readonly brandRepository: IBrandRepository,
  ) { }

  async call(param: CreateBrandDto): Promise<Brand> {
    // Criar a marca com manual = true (como especificado)
    const brand = await this.brandRepository.create({
      name: param.name,
      manual: true,
    });

    return brand;
  }
} 