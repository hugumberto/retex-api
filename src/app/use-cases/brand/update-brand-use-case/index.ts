import { Inject, Injectable } from '@nestjs/common';
import { Brand } from '../../../../domain/brand/brand.entity';
import { IBrandRepository } from '../../../../domain/brand/brand.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { UpdateBrandDto } from './update-brand.dto';

export { UpdateBrandDto };

export interface UpdateBrandParams {
  id: string;
  data: UpdateBrandDto;
}

@Injectable()
export class UpdateBrandUseCase implements IUseCase<UpdateBrandParams, Brand> {
  constructor(
    @Inject(DOMAIN_TOKENS.BRAND_REPOSITORY)
    private readonly brandRepository: IBrandRepository,
  ) { }

  async call(param: UpdateBrandParams): Promise<Brand> {
    // Verificar se a marca existe
    const existingBrand = await this.brandRepository.findOne({ id: param.id });

    if (!existingBrand) {
      throw new Error('Marca não encontrada');
    }

    // Atualizar a marca
    const updatedBrands = await this.brandRepository.update(
      { id: param.id },
      param.data
    );

    return updatedBrands[0];
  }
} 