import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Item } from '../../../../domain/item/item.entity';
import { IItemRepository } from '../../../../domain/item/item.repository';
import { IStorageUnitRepository } from '../../../../domain/storage-unit/storage-unit.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

@Injectable()
export class DeleteItemUseCase implements IUseCase<string, Item> {
  constructor(
    @Inject(DOMAIN_TOKENS.ITEM_REPOSITORY)
    private readonly itemRepository: IItemRepository,
    @Inject(DOMAIN_TOKENS.STORAGE_UNIT_REPOSITORY)
    private readonly storageUnitRepository: IStorageUnitRepository,
  ) {}

  async call(id: string): Promise<Item> {
    // findByIds carrega a relação storageUnit (necessária para o contador).
    const [existingItem] = await this.itemRepository.findByIds([id]);

    if (!existingItem) {
      throw new NotFoundException('Item não encontrado');
    }

    const deleted = await this.itemRepository.delete({ id });

    // Se estava vinculado a uma unidade, decrementa o contador denormalizado.
    if (existingItem.storageUnit?.id) {
      await this.storageUnitRepository.incrementItemsCount(
        existingItem.storageUnit.id,
        -1,
      );
    }

    return deleted;
  }
}
