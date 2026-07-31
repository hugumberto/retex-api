import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
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
      throw new NotFoundException('errors.brand.notFound');
    }

    // Ao mudar o nome, normalizar (trim) e não permitir colidir com outra marca.
    const data = { ...param.data };
    if (data.name !== undefined) {
      data.name = data.name.trim();
      const duplicate = await this.brandRepository.findByName(data.name);
      if (duplicate && duplicate.id !== param.id) {
        throw new ConflictException('errors.brand.duplicateName');
      }
    }

    // Atualizar a marca
    const updatedBrands = await this.brandRepository.update(
      { id: param.id },
      data
    );

    return updatedBrands[0];
  }
} 