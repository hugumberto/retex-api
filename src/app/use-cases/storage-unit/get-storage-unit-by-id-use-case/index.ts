import { Inject, Injectable } from '@nestjs/common';
import { StorageUnit } from '../../../../domain/storage-unit/storage-unit.entity';
import { IStorageUnitRepository } from '../../../../domain/storage-unit/storage-unit.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

@Injectable()
export class GetStorageUnitByIdUseCase implements IUseCase<string, StorageUnit> {
  constructor(
    @Inject(DOMAIN_TOKENS.STORAGE_UNIT_REPOSITORY)
    private readonly storageUnitRepository: IStorageUnitRepository,
  ) { }

  async call(id: string): Promise<StorageUnit> {
    return this.storageUnitRepository.findOneWithBrand({ id });
  }
} 