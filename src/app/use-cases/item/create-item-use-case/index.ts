import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { IBrandRepository } from '../../../../domain/brand/brand.repository';
import { Item } from '../../../../domain/item/item.entity';
import { IItemRepository } from '../../../../domain/item/item.repository';
import { PackageStatus } from '../../../../domain/package/package.entity';
import { IPackageRepository } from '../../../../domain/package/package.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { CreateItemDto } from './create-item.dto';

@Injectable()
export class CreateItemUseCase implements IUseCase<CreateItemDto, Item> {
  constructor(
    @Inject(DOMAIN_TOKENS.ITEM_REPOSITORY)
    private readonly itemRepository: IItemRepository,
    @Inject(DOMAIN_TOKENS.PACKAGE_REPOSITORY)
    private readonly packageRepository: IPackageRepository,
    @Inject(DOMAIN_TOKENS.BRAND_REPOSITORY)
    private readonly brandRepository: IBrandRepository,
  ) { }

  async call(param: CreateItemDto): Promise<Item> {
    // Validar se o package existe
    const packageEntity = await this.packageRepository.findOne({ id: param.packageId });
    if (!packageEntity) {
      throw new BadRequestException('Package não encontrado');
    }

    // Validar se a brand existe
    const brand = await this.brandRepository.findOne({ id: param.brandId });
    if (!brand) {
      throw new BadRequestException('Brand não encontrada');
    }

    // Verificar se é o primeiro item do package
    const existingItems = await this.itemRepository.findByPackageId(param.packageId);
    const isFirstItem = existingItems.length === 0;

    // Criar o item com storageUnit vazio
    const itemData: Partial<Item> = {
      package: packageEntity,
      quality: param.quality,
      type: param.type,
      season: param.season,
      brand: brand,
      quantity: param.quantity,
      storageUnit: null, // Inicialmente vazio
    };

    const createdItem = await this.itemRepository.create(itemData);

    // Se for o primeiro item, atualizar o status do package para SCREENING
    if (isFirstItem) {
      await this.packageRepository.update({ id: param.packageId }, {
        status: PackageStatus.SCREENING,
      });
    }

    return createdItem;
  }
}
