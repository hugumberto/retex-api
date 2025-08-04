import { Entity } from '../interfaces/entity.interface';
import { User } from './user.entity';

export interface RefreshToken extends Entity {
  token: string;
  user: User;
  expiresAt: Date;
  isRevoked: boolean;
  createdAt: Date;
  updatedAt: Date;
} 