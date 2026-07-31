import { ConflictException, Inject, Injectable } from '@nestjs/common';
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
    const name = param.name.trim();

    // Não permitir marcas com o mesmo nome (ignorando maiúsculas/espaços).
    const existing = await this.brandRepository.findByName(name);
    if (existing) {
      throw new ConflictException('errors.brand.duplicateName');
    }

    // Criar a marca com manual = true (como especificado)
    const brand = await this.brandRepository.create({
      name,
      manual: true,
    });

    return brand;
  }
} 