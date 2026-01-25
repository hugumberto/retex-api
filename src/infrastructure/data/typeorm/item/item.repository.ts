import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ILocalStorageService } from '../../../../app/services/local-storage/local-storage.service';
import { SERVICE_TOKENS } from '../../../../app/services/tokens';
import { Item } from '../../../../domain/item/item.entity';
import { IItemRepository } from '../../../../domain/item/item.repository';
import { BaseRepository } from '../abstraction/base.repository';
import { itemSchema } from './item.schema';

@Injectable()
export class ItemRepository extends BaseRepository<Item> implements IItemRepository {
  constructor(
    @InjectRepository(itemSchema)
    itemRepository: Repository<Item>,
    @Inject(SERVICE_TOKENS.LOCAL_STORAGE_SERVICE)
    localStorageService: ILocalStorageService,
  ) {
    super(itemRepository, localStorageService);
  }

  async findByIds(ids: string[]): Promise<Item[]> {
    const repository = await this.getRepository();
    return repository.find({
      where: { id: In(ids) },
      relations: ['package', 'brand', 'storageUnit'],
    });
  }

  async findByPackageId(packageId: string): Promise<Item[]> {
    const repository = await this.getRepository();
    return repository.find({
      where: { package: { id: packageId } },
      relations: ['package', 'brand', 'storageUnit'],
    });
  }
} 