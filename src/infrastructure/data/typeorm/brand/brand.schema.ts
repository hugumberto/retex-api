import { EntitySchema } from 'typeorm';
import { Brand } from '../../../../domain/brand/brand.entity';
import { BaseTimestampColumns } from '../abstraction/timestamp';

export const brandSchema = new EntitySchema<Brand>({
  name: 'brand',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    name: {
      type: 'varchar',
      nullable: false,
      length: 255,
    },
    manual: {
      type: 'boolean',
      nullable: false,
      default: false,
    },
    ...BaseTimestampColumns,
  },
}); 