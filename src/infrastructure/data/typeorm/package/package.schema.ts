import { EntitySchema } from 'typeorm';
import { Package, PackageStatus } from '../../../../domain/package/package.entity';
import { BaseTimestampColumns } from '../abstraction/timestamp';

export const packageSchema = new EntitySchema<Package>({
  name: 'package',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    status: {
      type: 'enum',
      enum: PackageStatus,
      nullable: false,
    },
    weight: {
      type: 'decimal',
      precision: 10,
      scale: 2,
      nullable: true,
    },
    collectDay: {
      type: 'varchar',
      nullable: true,
      length: 20,
      name: 'collect_day',
    },
    collectTime: {
      type: 'varchar',
      nullable: true,
      length: 20,
      name: 'collect_time',
    },
    addressId: {
      type: 'uuid',
      nullable: true,
      name: 'address_id',
    },
    ...BaseTimestampColumns,
  },
  relations: {
    user: {
      type: 'many-to-one',
      target: 'user',
      joinColumn: {
        name: 'user_id',
      },
      inverseSide: 'packages',
    },
    address: {
      type: 'many-to-one',
      target: 'user_address',
      joinColumn: {
        name: 'address_id',
      },
      inverseSide: null,
      nullable: true,
    },
    route: {
      type: 'many-to-one',
      target: 'route',
      joinColumn: {
        name: 'route_id',
      },
      inverseSide: 'packages',
      nullable: true,
    },
    items: {
      type: 'one-to-many',
      target: 'item',
      joinColumn: {
        name: 'package_id',
      },
      inverseSide: 'package',
    },
  },
});
