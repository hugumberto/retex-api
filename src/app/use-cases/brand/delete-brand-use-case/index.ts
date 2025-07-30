import { Inject, Injectable } from '@nestjs/common';
import { Brand } from '../../../../domain/brand/brand.entity';
import { IBrandRepository } from '../../../../domain/brand/brand.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

@Injectable()
export class DeleteBrandUseCase implements IUseCase<string, Brand> {
  constructor(
    @Inject(DOMAIN_TOKENS.BRAND_REPOSITORY)
    private readonly brandRepository: IBrandRepository,
  ) { }

  async call(id: string): Promise<Brand> {
    // Verificar se a marca existe
    const existingBrand = await this.brandRepository.findOne({ id });

    if (!existingBrand) {
      throw new Error('Marca não encontrada');
    }

    // Deletar a marca
    const deletedBrand = await this.brandRepository.delete({ id });

    return deletedBrand;
  }
} 