import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Item } from '../../../../domain/item/item.entity';
import { IItemRepository } from '../../../../domain/item/item.repository';
import { BaseRepository } from '../abstraction/base.repository';
import { itemSchema } from './item.schema';

@Injectable()
export class ItemRepository extends BaseRepository<Item> implements IItemRepository {
  constructor(
    @InjectRepository(itemSchema)
    private readonly itemRepository: Repository<Item>,
  ) {
    super(itemRepository);
  }

  async findByIds(ids: string[]): Promise<Item[]> {
    return this.itemRepository.find({
      where: { id: In(ids) },
      relations: ['package', 'brand', 'storageUnit'],
    });
  }

  async findByPackageId(packageId: string): Promise<Item[]> {
    return this.itemRepository.find({
      where: { package: { id: packageId } },
      relations: ['package', 'brand', 'storageUnit'],
    });
  }
} 