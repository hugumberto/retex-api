import { EntitySchema } from 'typeorm';
import { UserStatus } from '../../../../domain/user/user-status.enum';
import { User } from '../../../../domain/user/user.entity';
import { BaseTimestampColumns } from '../abstraction/timestamp';

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
    documentNumber: {
      type: 'varchar',
      nullable: false,
      length: 20,
      unique: true,
      name: 'document_number',
    },
    status: {
      type: 'enum',
      enum: UserStatus,
      nullable: false,
      name: 'status',
    },
    ...BaseTimestampColumns,
  },
  relations: {
    packages: {
      type: 'one-to-many',
      target: 'package',
      joinColumn: {
        name: 'user_id',
      },
      inverseSide: 'user',
    },
    routes: {
      type: 'one-to-many',
      target: 'route',
      joinColumn: {
        name: 'user_id',
      },
      inverseSide: 'user',
    },
    roles: {
      type: 'one-to-many',
      target: 'user_role',
      joinColumn: {
        name: 'user_id',
      },
      inverseSide: 'user',
    },
  },
  indices: [
    {
      name: 'IDX_USER_DOCUMENT_NUMBER',
      unique: true,
      columns: ['documentNumber'],
    },
  ],
});
