import { EntitySchema } from 'typeorm';
import { Gender } from '../../../../domain/user/gender.enum';
import { UserStatus } from '../../../../domain/user/user-status.enum';
import { UserType } from '../../../../domain/user/user-type.enum';
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
      unique: true,
    },
    contactPhone: {
      type: 'varchar',
      nullable: false,
      length: 20,
      name: 'contact_phone',
    },
    password: {
      type: 'varchar',
      nullable: false,
      length: 255,
      name: 'password',
    },
    status: {
      type: 'enum',
      enum: UserStatus,
      nullable: false,
      name: 'status',
    },
    userType: {
      type: 'enum',
      enum: UserType,
      nullable: false,
      name: 'user_type',
    },
    gender: {
      type: 'enum',
      enum: Gender,
      nullable: true,
      name: 'gender',
    },
    dateOfBirth: {
      type: 'date',
      nullable: true,
      name: 'date_of_birth',
    },
    activationToken: {
      type: 'varchar',
      nullable: true,
      length: 255,
      name: 'activation_token',
      unique: true,
    },
    activationTokenExpiresAt: {
      type: 'timestamp',
      nullable: true,
      name: 'activation_token_expires_at',
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
    addresses: {
      type: 'one-to-many',
      target: 'user_address',
      joinColumn: {
        name: 'user_id',
      },
      inverseSide: 'user',
    },
  },
  indices: [
    {
      name: 'IDX_USER_EMAIL',
      unique: true,
      columns: ['email'],
    },
  ],
});
