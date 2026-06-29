import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Item } from '../../../../domain/item/item.entity';
import { IItemRepository } from '../../../../domain/item/item.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

@Injectable()
export class DeleteItemUseCase implements IUseCase<string, Item> {
  constructor(
    @Inject(DOMAIN_TOKENS.ITEM_REPOSITORY)
    private readonly itemRepository: IItemRepository,
  ) {}

  async call(id: string): Promise<Item> {
    const existingItem = await this.itemRepository.findOne({ id });

    if (!existingItem) {
      throw new NotFoundException('Item não encontrado');
    }

    return this.itemRepository.delete({ id });
  }
}
