import { Inject, Injectable } from '@nestjs/common';
import { StorageUnit } from '../../../../domain/storage-unit/storage-unit.entity';
import { IStorageUnitRepository } from '../../../../domain/storage-unit/storage-unit.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { resolveEntityId } from '../../shared/identifier.util';

@Injectable()
export class GetStorageUnitByIdUseCase implements IUseCase<string, StorageUnit> {
  constructor(
    @Inject(DOMAIN_TOKENS.STORAGE_UNIT_REPOSITORY)
    private readonly storageUnitRepository: IStorageUnitRepository,
  ) { }

  async call(identifier: string): Promise<StorageUnit> {
    const id = await this.resolveId(identifier);
    return this.storageUnitRepository.findOneWithBrand({ id });
  }

  // Aceita o id (UUID) ou o código amigável e devolve o id.
  private resolveId(identifier: string): Promise<string> {
    return resolveEntityId(
      identifier,
      (friendlyCode) =>
        this.storageUnitRepository.findOne({
          friendlyCode,
        } as Partial<StorageUnit>),
      'errors.storageUnit.notFound',
    );
  }
}
