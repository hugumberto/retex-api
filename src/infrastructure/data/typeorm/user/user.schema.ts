import { EntitySchema } from 'typeorm';
import { UserStatus } from '../../../../domain/user/user-status.enum';
import { User } from '../../../../domain/user/user.entity';
import { BaseTimestampColumns } from '../abstraction/timestamp';
import { addressEmbedded } from './address.embedded';

export const userSchema = new EntitySchema<User>({
  name: 'user',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    firstName: {
      type: 'varchar',
      nullable: false,
      length: 255,
      name: 'first_name',
    },
    lastName: {
      type: 'varchar',
      nullable: false,
      length: 255,
      name: 'last_name',
    },
    email: {
      type: 'varchar',
      nullable: false,
      length: 255,
      name: 'email',
    },
    contactPhone: {
      type: 'varchar',
      nullable: false,
      length: 20,
      name: 'contact_phone',
    },
    dayOfWeek: {
      type: 'varchar',
      nullable: false,
      length: 20,
      name: 'day_of_week',
    },
    timeOfDay: {
      type: 'varchar',
      nullable: false,
      length: 20,
      name: 'time_of_day',
    },
    nif: {
      type: 'varchar',
      nullable: false,
      length: 20,
      unique: true,
      name: 'nif',
    },
    status: {
      type: 'enum',
      enum: UserStatus,
      nullable: false,
      name: 'status',
    },
    ...BaseTimestampColumns,
  },
  embeddeds: {
    address: {
      schema: addressEmbedded,
      prefix: 'address_',
    },
  },
  indices: [
    {
      name: 'IDX_USER_NIF',
      unique: true,
      columns: ['nif'],
    },
  ],
});
