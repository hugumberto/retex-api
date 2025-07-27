import { EntitySchema } from 'typeorm';
import { Role, UserRole } from '../../../../domain/user/user-roles.entity';
import { BaseTimestampColumns } from '../abstraction/timestamp';

export const userRoleSchema = new EntitySchema<UserRole>({
  name: 'user_role',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    role: {
      type: 'enum',
      enum: Role,
      nullable: false,
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
      inverseSide: 'roles',
    },
  },
}); 