import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Item } from '../../../../domain/item/item.entity';
import { IItemRepository } from '../../../../domain/item/item.repository';
import { PackageStatus } from '../../../../domain/package/package.entity';
import { IPackageRepository } from '../../../../domain/package/package.repository';
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

    // Coletar todos os erros sem fazer nenhum bind
    const errors: string[] = [];
    const bindingPlan: { item: Item; storageUnit: StorageUnit }[] = [];
    const storageUnitsAvailable = [...storageUnits]; // Cópia para não modificar o original

    for (const item of items) {
      // Validar se item já não está associado a um storage unit
      if (item.storageUnit) {
        errors.push(`Item ${item.id} já está associado a um Storage Unit`);
        continue;
      }

      // Buscar storage unit compatível
      const compatibleStorageUnit = this.findCompatibleStorageUnit(item, storageUnitsAvailable);

      if (!compatibleStorageUnit) {
        errors.push(`Nenhum Storage Unit compatível encontrado para item ${item.id} (brand: ${item.brand.name}, quality: ${item.quality})`);
        continue;
      }

      // Adicionar ao plano de bind
      bindingPlan.push({ item, storageUnit: compatibleStorageUnit });

      // Remover storage unit da lista disponível para evitar conflitos
      const index = storageUnitsAvailable.indexOf(compatibleStorageUnit);
      if (index > -1) {
        storageUnitsAvailable.splice(index, 1);
      }
    }

    // Se houver qualquer erro, falhar toda a operação
    if (errors.length > 0) {
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
        // Se falhar qualquer bind, reverter os anteriores seria ideal, 
        // mas por simplicidade vamos logar o erro
        throw new BadRequestException(`Erro ao fazer bind do item ${item.id}: ${error.message}`);
      }
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
    // Buscar storage units compatíveis (brand e quality)
    const compatible = storageUnits.filter(su =>
      su.brand.id === item.brand.id &&
      su.quality === item.quality
    );

    if (compatible.length === 0) {
      return null;
    }

    // Critério de desempate: menor weight
    return compatible.sort((a, b) => a.weight - b.weight)[0];
  }
}
