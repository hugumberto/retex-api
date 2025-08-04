import { EntitySchema } from 'typeorm';
import { RefreshToken } from '../../../../domain/user/refresh-token.entity';
import { BaseTimestampColumns } from '../abstraction/timestamp';

export const refreshTokenSchema = new EntitySchema<RefreshToken>({
  name: 'refresh_token',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    token: {
      type: 'varchar',
      nullable: false,
      length: 255,
      unique: true,
      name: 'token',
    },
    expiresAt: {
      type: 'timestamp with time zone',
      nullable: false,
      name: 'expires_at',
    },
    isRevoked: {
      type: 'boolean',
      nullable: false,
      default: false,
      name: 'is_revoked',
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
      nullable: false,
    },
  },
  indices: [
    {
      name: 'IDX_REFRESH_TOKEN_TOKEN',
      unique: true,
      columns: ['token'],
    },
    {
      name: 'IDX_REFRESH_TOKEN_USER_ID',
      columns: ['user'],
    },
    {
      name: 'IDX_REFRESH_TOKEN_EXPIRES_AT',
      columns: ['expiresAt'],
    },
  ],
}); 