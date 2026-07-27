import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { StorageUnit } from '../../../../domain/storage-unit/storage-unit.entity';
import { IStorageUnitRepository } from '../../../../domain/storage-unit/storage-unit.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

// Deteta se o identificador é um UUID (id) — caso contrário, assume-se o código
// amigável (`ano-XXXXXX`) da unidade de armazenamento.
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  private async resolveId(identifier: string): Promise<string> {
    const value = identifier.trim();

    if (UUID_REGEX.test(value)) {
      return value;
    }

    const byFriendlyCode = await this.storageUnitRepository.findOne({
      friendlyCode: value,
    } as Partial<StorageUnit>);

    if (!byFriendlyCode) {
      throw new NotFoundException('Unidade de armazenamento não encontrada');
    }

    return byFriendlyCode.id;
  }
}
