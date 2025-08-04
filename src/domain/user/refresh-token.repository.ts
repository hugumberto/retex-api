import { IRepository } from '../interfaces/repository.interface';
import { RefreshToken } from './refresh-token.entity';

export interface IRefreshTokenRepository extends IRepository<RefreshToken> {
  findByToken(token: string): Promise<RefreshToken | null>;
  findValidTokensByUserId(userId: string): Promise<RefreshToken[]>;
  revokeAllUserTokens(userId: string): Promise<void>;
  deleteExpiredTokens(): Promise<void>;
} 