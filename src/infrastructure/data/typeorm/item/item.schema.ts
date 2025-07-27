import { EntitySchema } from 'typeorm';
import { Item, Quality, Season, Type } from '../../../../domain/item/item.entity';
import { BaseTimestampColumns } from '../abstraction/timestamp';

export const itemSchema = new EntitySchema<Item>({
  name: 'item',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    quality: {
      type: 'enum',
      enum: Quality,
      nullable: false,
    },
    type: {
      type: 'enum',
      enum: Type,
      nullable: false,
    },
    season: {
      type: 'enum',
      enum: Season,
      nullable: false,
    },
    quantity: {
      type: 'integer',
      nullable: false,
    },
    ...BaseTimestampColumns,
  },
  relations: {
    package: {
      type: 'many-to-one',
      target: 'package',
      joinColumn: {
        name: 'package_id',
      },
      inverseSide: 'items',
    },
    storageUnit: {
      type: 'many-to-one',
      target: 'storage_unit',
      joinColumn: {
        name: 'storage_unit_id',
      },
    },
    brand: {
      type: 'many-to-one',
      target: 'brand',
      joinColumn: {
        name: 'brand_id',
      },
    },
  },
}); 