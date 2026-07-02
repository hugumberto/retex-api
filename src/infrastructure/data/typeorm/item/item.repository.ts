import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ILocalStorageService } from '../../../../app/services/local-storage/local-storage.service';
import { SERVICE_TOKENS } from '../../../../app/services/tokens';
import { Item } from '../../../../domain/item/item.entity';
import {
  IItemRepository,
  ItemBrandCount,
  ItemDimension,
  ItemDimensionCount,
} from '../../../../domain/item/item.repository';
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

  async aggregateBy(dimension: ItemDimension): Promise<ItemDimensionCount[]> {
    const repository = await this.getRepository();
    // Whitelist runtime: nunca interpolar `dimension` no SQL sem validar, pois o
    // tipo é apagado em runtime (defesa contra valores inválidos / injeção).
    const columns: Record<ItemDimension, string> = {
      quality: 'quality',
      season: 'season',
      type: 'type',
    };
    const column = columns[dimension];
    if (!column) {
      throw new Error(`Dimensão de item inválida: ${dimension}`);
    }
    const rows = await repository
      .createQueryBuilder('item')
      .select(`item.${column}`, 'key')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(item.quantity), 0)', 'quantity')
      .groupBy(`item.${column}`)
      .getRawMany<{ key: string; count: string; quantity: string }>();

    return rows.map((row) => ({
      key: row.key,
      count: Number(row.count),
      quantity: Number(row.quantity),
    }));
  }

  async aggregateByBrand(): Promise<ItemBrandCount[]> {
    const repository = await this.getRepository();
    const rows = await repository
      .createQueryBuilder('item')
      .leftJoin('item.brand', 'brand')
      .select("COALESCE(brand.name, 'Sem marca')", 'brand')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(item.quantity), 0)', 'quantity')
      .groupBy('brand.name')
      .orderBy('COUNT(*)', 'DESC')
      .getRawMany<{ brand: string; count: string; quantity: string }>();

    return rows.map((row) => ({
      brand: row.brand,
      count: Number(row.count),
      quantity: Number(row.quantity),
    }));
  }
}