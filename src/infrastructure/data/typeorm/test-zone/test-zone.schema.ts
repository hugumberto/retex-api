import { EntitySchema } from 'typeorm';
import { TestZone } from '../../../../domain/test-zone/test-zone.entity';
import { BaseTimestampColumns } from '../abstraction/timestamp';

export const testZoneSchema = new EntitySchema<TestZone>({
  name: 'test_zone',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    city: {
      type: 'varchar',
      nullable: false,
      length: 255,
    },
    ...BaseTimestampColumns,
  },
}); 