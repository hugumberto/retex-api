import { EntitySchema } from 'typeorm';
import { Vehicle } from '../../../../domain/vehicle/vehicle.entity';
import { BaseTimestampColumns } from '../abstraction/timestamp';

export const vehicleSchema = new EntitySchema<Vehicle>({
  name: 'vehicle',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    plate: {
      type: 'varchar',
      length: 20,
      nullable: false,
      unique: true,
    },
    name: {
      type: 'varchar',
      length: 100,
      nullable: false,
    },
    capacityBags: {
      name: 'capacity_bags',
      type: 'integer',
      nullable: false,
    },
    active: {
      type: 'boolean',
      nullable: false,
      default: true,
    },
    ...BaseTimestampColumns,
  },
});
