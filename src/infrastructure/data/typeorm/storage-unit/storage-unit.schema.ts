import { EntitySchema } from 'typeorm';
import { Quality } from '../../../../domain/item/item.entity';
import { StorageUnit } from '../../../../domain/storage-unit/storage-unit.entity';
import { BaseTimestampColumns } from '../abstraction/timestamp';

export const storageUnitSchema = new EntitySchema<StorageUnit>({
  name: 'storage_unit',
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
    weight: {
      type: 'decimal',
      precision: 10,
      scale: 2,
      nullable: false,
    },
    ...BaseTimestampColumns,
  },
  relations: {
    brand: {
      type: 'many-to-one',
      target: 'brand',
      joinColumn: {
        name: 'brand_id',
      },
    },
  },
}); 