import { Inject, Injectable } from '@nestjs/common';
import { StorageUnit, StorageUnitStatus } from '../../../../domain/storage-unit/storage-unit.entity';
import { IStorageUnitRepository } from '../../../../domain/storage-unit/storage-unit.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { generateUniqueFriendlyCode } from '../../shared/friendly-code.util';
import { CreateStorageUnitDto } from './create-storage-unit.dto';

export { CreateStorageUnitDto };

@Injectable()
export class CreateStorageUnitUseCase implements IUseCase<CreateStorageUnitDto, StorageUnit> {
  constructor(
    @Inject(DOMAIN_TOKENS.STORAGE_UNIT_REPOSITORY)
    private readonly storageUnitRepository: IStorageUnitRepository,
  ) { }

  async call(param: CreateStorageUnitDto): Promise<StorageUnit> {
    const friendlyCode = await this.generateUniqueFriendlyCode();

    // Criar o StorageUnit com peso inicial = 0
    const storageUnit = await this.storageUnitRepository.create({
      friendlyCode,
      quality: param.quality,
      sex: param.sex,
      ageGroup: param.ageGroup,
      type: param.type,
      season: param.season,
      status: StorageUnitStatus.ATIVO,
      weight: 0,
    });

    return storageUnit;
  }

  /**
   * Gera um código amigável (`ano-XXXXXX`) único contra os já existentes. O
   * índice único na coluna é a rede de segurança final.
   */
  private generateUniqueFriendlyCode(): Promise<string> {
    return generateUniqueFriendlyCode((friendlyCode) =>
      this.storageUnitRepository.findOne({
        friendlyCode,
      } as Partial<StorageUnit>),
    );
  }
}