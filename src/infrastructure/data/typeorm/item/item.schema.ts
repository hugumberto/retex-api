import { EntitySchema } from 'typeorm';
import { Category } from '../../../../domain/item/item-category';
import {
  AgeGroup,
  Condition,
  Destination,
  Item,
  Season,
  Sex,
  Type,
} from '../../../../domain/item/item.entity';
import { BaseTimestampColumns } from '../abstraction/timestamp';

export const itemSchema = new EntitySchema<Item>({
  name: 'item',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    destination: {
      type: 'enum',
      enum: Destination,
      nullable: false,
      default: Destination.REUSE,
    },
    type: {
      type: 'enum',
      enum: Type,
      nullable: true,
    },
    season: {
      type: 'enum',
      enum: Season,
      nullable: true,
    },
    sex: {
      type: 'enum',
      enum: Sex,
      nullable: true,
    },
    ageGroup: {
      name: 'age_group',
      type: 'enum',
      enum: AgeGroup,
      nullable: true,
    },
    category: {
      type: 'enum',
      enum: Category,
      nullable: true,
    },
    condition: {
      type: 'enum',
      enum: Condition,
      nullable: true,
    },
    denim: {
      type: 'boolean',
      nullable: true,
    },
    material: {
      type: 'varchar',
      length: 100,
      nullable: true,
    },
    color: {
      type: 'varchar',
      length: 50,
      nullable: true,
    },
    size: {
      type: 'varchar',
      length: 20,
      nullable: true,
    },
    quantity: {
      type: 'integer',
      nullable: false,
    },
    ...BaseTimestampColumns,
  },
  relations: {
    collectionRequest: {
      type: 'many-to-one',
      target: 'collection_request',
      joinColumn: {
        name: 'collection_request_id',
      },
      inverseSide: 'items',
    },
    storageUnit: {
      type: 'many-to-one',
      target: 'storage_unit',
      joinColumn: {
        name: 'storage_unit_id',
      },
      inverseSide: 'items',
    },
    brand: {
      type: 'many-to-one',
      target: 'brand',
      joinColumn: {
        name: 'brand_id',
      },
    },
    bag: {
      type: 'many-to-one',
      target: 'collection_request_bag',
      joinColumn: {
        name: 'collection_request_bag_id',
      },
      nullable: true,
    },
    operator: {
      type: 'many-to-one',
      target: 'user',
      joinColumn: {
        name: 'operator_id',
      },
      nullable: true,
    },
  },
});
