import { Inject, Injectable } from '@nestjs/common';
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
  ) { }

  async call(param: UpdateStorageUnitParams): Promise<StorageUnit> {
    const { id, data } = param;

    // Buscar o StorageUnit existente
    const existingStorageUnit = await this.storageUnitRepository.findOne({ id });
    if (!existingStorageUnit) {
      throw new Error('StorageUnit não encontrado');
    }

    const updateData: Partial<StorageUnit> = {};

    // Atualizar campos se fornecidos
    if (data.quality !== undefined) {
      updateData.quality = data.quality;
    }

    if (data.sex !== undefined) {
      updateData.sex = data.sex;
    }

    if (data.ageGroup !== undefined) {
      updateData.ageGroup = data.ageGroup;
    }

    if (data.type !== undefined) {
      updateData.type = data.type;
    }

    if (data.season !== undefined) {
      updateData.season = data.season;
    }

    if (data.weight !== undefined) {
      updateData.weight = data.weight;
    }

    // Executar a atualização
    const [updatedStorageUnit] = await this.storageUnitRepository.update({ id }, updateData);

    return updatedStorageUnit;
  }
} 