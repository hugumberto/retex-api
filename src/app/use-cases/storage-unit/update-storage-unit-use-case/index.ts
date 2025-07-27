import { Inject, Injectable } from '@nestjs/common';
import { IBrandRepository } from '../../../../domain/brand/brand.repository';
import { StorageUnit } from '../../../../domain/storage-unit/storage-unit.entity';
import { IStorageUnitRepository } from '../../../../domain/storage-unit/storage-unit.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { UpdateStorageUnitDto } from './update-storage-unit.dto';

export { UpdateStorageUnitDto };

export interface UpdateStorageUnitParams {
  id: string;
  data: UpdateStorageUnitDto;
}

@Injectable()
export class UpdateStorageUnitUseCase implements IUseCase<UpdateStorageUnitParams, StorageUnit> {
  constructor(
    @Inject(DOMAIN_TOKENS.STORAGE_UNIT_REPOSITORY)
    private readonly storageUnitRepository: IStorageUnitRepository,
    @Inject(DOMAIN_TOKENS.BRAND_REPOSITORY)
    private readonly brandRepository: IBrandRepository,
  ) { }

  async call(param: UpdateStorageUnitParams): Promise<StorageUnit> {
    const { id, data } = param;

    // Buscar o StorageUnit existente
    const existingStorageUnit = await this.storageUnitRepository.findOne({ id });
    if (!existingStorageUnit) {
      throw new Error('StorageUnit não encontrado');
    }

    const updateData: Partial<StorageUnit> = {};

    // Se houver mudança de marca, buscar a marca pelo ID
    if (data.brandId) {
      const brand = await this.brandRepository.findOne({ id: data.brandId });

      if (!brand) {
        throw new Error('Marca não encontrada');
      }

      updateData.brand = brand;
    }

    // Atualizar outros campos se fornecidos
    if (data.quality !== undefined) {
      updateData.quality = data.quality;
    }

    if (data.weight !== undefined) {
      updateData.weight = data.weight;
    }

    // Executar a atualização
    const [updatedStorageUnit] = await this.storageUnitRepository.update({ id }, updateData);

    return updatedStorageUnit;
  }
} 