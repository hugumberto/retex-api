import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { isValidStorageSlot } from '../../../../domain/storage-unit/storage-slot';
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
    if (data.group !== undefined) {
      updateData.group = data.group;
    }

    if (data.type !== undefined) {
      updateData.type = data.type;
    }

    if (data.season !== undefined) {
      updateData.season = data.season;
    }

    if (data.location !== undefined) {
      updateData.location = data.location?.trim() || null;
    }

    // A combinação resultante tem de continuar a ser um lote válido.
    const slot = {
      group: updateData.group ?? existingStorageUnit.group,
      season: updateData.season !== undefined ? updateData.season : existingStorageUnit.season ?? null,
      type: updateData.type !== undefined ? updateData.type : existingStorageUnit.type ?? null,
    };
    if (!isValidStorageSlot(slot)) {
      throw new BadRequestException('errors.storageUnit.invalidSlot');
    }

    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    if (data.weight !== undefined) {
      updateData.weight = data.weight;
    }

    // Executar a atualização
    const [updatedStorageUnit] = await this.storageUnitRepository.update({ id }, updateData);

    return updatedStorageUnit;
  }
} 