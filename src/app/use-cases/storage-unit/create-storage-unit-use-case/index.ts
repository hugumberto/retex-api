import { Inject, Injectable } from '@nestjs/common';
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
  ) { }

  async call(param: CreateStorageUnitDto): Promise<StorageUnit> {
    // Criar o StorageUnit com peso inicial = 0
    const storageUnit = await this.storageUnitRepository.create({
      quality: param.quality,
      sex: param.sex,
      ageGroup: param.ageGroup,
      type: param.type,
      season: param.season,
      weight: 0,
    });

    return storageUnit;
  }
}