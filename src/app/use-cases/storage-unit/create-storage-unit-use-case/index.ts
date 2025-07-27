import { Inject, Injectable } from '@nestjs/common';
import { IBrandRepository } from '../../../../domain/brand/brand.repository';
import { StorageUnit } from '../../../../domain/storage-unit/storage-unit.entity';
import { IStorageUnitRepository } from '../../../../domain/storage-unit/storage-unit.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { CreateStorageUnitDto } from './create-storage-unit.dto';

export { CreateStorageUnitDto };

@Injectable()
export class CreateStorageUnitUseCase implements IUseCase<CreateStorageUnitDto, StorageUnit> {
  constructor(
    @Inject(DOMAIN_TOKENS.STORAGE_UNIT_REPOSITORY)
    private readonly storageUnitRepository: IStorageUnitRepository,
    @Inject(DOMAIN_TOKENS.BRAND_REPOSITORY)
    private readonly brandRepository: IBrandRepository,
  ) { }

  async call(param: CreateStorageUnitDto): Promise<StorageUnit> {
    // Buscar a marca pelo ID
    const brand = await this.brandRepository.findOne({ id: param.brandId });

    if (!brand) {
      throw new Error('Marca não encontrada');
    }

    // Criar o StorageUnit com peso inicial = 0
    const storageUnit = await this.storageUnitRepository.create({
      brand,
      quality: param.quality,
      weight: 0,
    });

    return storageUnit;
  }
} 