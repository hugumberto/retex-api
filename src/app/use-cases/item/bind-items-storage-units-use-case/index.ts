import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Item } from '../../../../domain/item/item.entity';
import { IItemRepository } from '../../../../domain/item/item.repository';
import { PackageStatus } from '../../../../domain/package/package.entity';
import { IPackageRepository } from '../../../../domain/package/package.repository';
import { IQrCodeRepository } from '../../../../domain/qr-code/qr-code.repository';
import { StorageUnit } from '../../../../domain/storage-unit/storage-unit.entity';
import { IStorageUnitRepository } from '../../../../domain/storage-unit/storage-unit.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { BindItemsStorageUnitsDto } from './bind-items-storage-units.dto';

export interface BindItemsStorageUnitsResult {
  success: string[];
  packageId: string;
  packageStatus: PackageStatus;
}

@Injectable()
export class BindItemsStorageUnitsUseCase implements IUseCase<BindItemsStorageUnitsDto, BindItemsStorageUnitsResult> {
  constructor(
    @Inject(DOMAIN_TOKENS.ITEM_REPOSITORY)
    private readonly itemRepository: IItemRepository,
    @Inject(DOMAIN_TOKENS.STORAGE_UNIT_REPOSITORY)
    private readonly storageUnitRepository: IStorageUnitRepository,
    @Inject(DOMAIN_TOKENS.PACKAGE_REPOSITORY)
    private readonly packageRepository: IPackageRepository,
    @Inject(DOMAIN_TOKENS.QR_CODE_REPOSITORY)
    private readonly qrCodeRepository: IQrCodeRepository,
  ) { }

  async call(param: BindItemsStorageUnitsDto): Promise<BindItemsStorageUnitsResult> {
    // Buscar todos os itens e storage units
    const items = await this.itemRepository.findByIds(param.items);
    const storageUnits = await this.storageUnitRepository.findByIds(param.storageUnits);

    // Validar se todos os IDs existem
    const foundItemIds = items.map(item => item.id);
    const missingItems = param.items.filter(id => !foundItemIds.includes(id));

    const foundStorageUnitIds = storageUnits.map(su => su.id);
    const missingStorageUnits = param.storageUnits.filter(id => !foundStorageUnitIds.includes(id));

    if (missingItems.length > 0) {
      throw new BadRequestException(`Itens não encontrados: ${missingItems.join(', ')}`);
    }

    if (missingStorageUnits.length > 0) {
      throw new BadRequestException(`Storage Units não encontrados: ${missingStorageUnits.join(', ')}`);
    }

    // Verificar se todos os itens pertencem ao mesmo package
    const packageIds = [...new Set(items.map(item => item.package.id))];
    if (packageIds.length !== 1) {
      throw new BadRequestException('Todos os itens devem pertencer ao mesmo package');
    }
    const packageId = packageIds[0];
    // `finalize` (default true): finaliza a triagem. `false` só persiste os
    // vínculos (salvar progresso), sem STOCKED/survey e sem exigir todos
    // os volumes processados.
    const finalize = param.finalize !== false;

    // Trava (só ao finalizar): todos os volumes (QR codes) do pacote
    // precisam estar processados.
    if (finalize) {
      const qrCodes = await this.qrCodeRepository.find({ packageId });
      if (qrCodes.some((qr) => qr.processedAt == null)) {
        throw new BadRequestException('Nem todos os volumes foram processados');
      }
    }

    const errors: string[] = [];
    const bindingPlan: { item: Item; storageUnit: StorageUnit }[] = [];

    for (const item of items) {
      // Item já vinculado → ignora (idempotente: permite salvar progresso e
      // depois finalizar sem reerro).
      if (item.storageUnit) {
        continue;
      }

      // Uma unidade (bin) pode receber vários itens do mesmo tipo — a unidade
      // NÃO é consumida. Itens iguais de volumes diferentes vão para a mesma
      // unidade compatível (menor peso).
      const compatibleStorageUnit = this.findCompatibleStorageUnit(
        item,
        storageUnits,
      );

      if (!compatibleStorageUnit) {
        // Ao finalizar é erro; ao salvar progresso, apenas ignora o item.
        if (finalize) {
          errors.push(
            `Nenhum Storage Unit compatível encontrado para item ${item.id} (quality: ${item.quality}, sex: ${item.sex}, ageGroup: ${item.ageGroup}, type: ${item.type}, season: ${item.season})`,
          );
        }
        continue;
      }

      bindingPlan.push({ item, storageUnit: compatibleStorageUnit });
    }

    if (finalize && errors.length > 0) {
      throw new BadRequestException(`Operação cancelada devido a erros: ${errors.join('; ')}`);
    }

    const successfulBinds: string[] = [];

    for (const { item, storageUnit } of bindingPlan) {
      try {
        await this.itemRepository.update({ id: item.id }, {
          storageUnit: storageUnit,
        });
        successfulBinds.push(item.id);
      } catch (error) {
        throw new BadRequestException(`Erro ao fazer bind do item ${item.id}: ${error.message}`);
      }
    }

    if (!finalize) {
      return {
        success: successfulBinds,
        packageId,
        packageStatus: PackageStatus.SCREENING,
      };
    }

    await this.packageRepository.update({ id: packageId }, {
      status: PackageStatus.STOCKED,
    });

    return {
      success: successfulBinds,
      packageId: packageId,
      packageStatus: PackageStatus.STOCKED,
    };
  }

  private findCompatibleStorageUnit(item: Item, storageUnits: StorageUnit[]): StorageUnit | null {
    // Buscar storage units compatíveis pelos atributos de triagem
    const compatible = storageUnits.filter(su =>
      su.quality === item.quality &&
      su.sex === item.sex &&
      su.ageGroup === item.ageGroup &&
      su.type === item.type &&
      su.season === item.season
    );

    if (compatible.length === 0) {
      return null;
    }

    // Critério de desempate: menor weight
    return compatible.sort((a, b) => a.weight - b.weight)[0];
  }
}
