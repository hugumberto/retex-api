import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, MoreThan, Repository } from 'typeorm';
import { RefreshToken } from '../../../../domain/user/refresh-token.entity';
import { IRefreshTokenRepository } from '../../../../domain/user/refresh-token.repository';
import { BaseRepository } from '../abstraction/base.repository';
import { refreshTokenSchema } from './refresh-token.schema';

@Injectable()
export class RefreshTokenRepository
  extends BaseRepository<RefreshToken>
  implements IRefreshTokenRepository {
  constructor(
    @InjectRepository(refreshTokenSchema)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {
    super(refreshTokenRepository);
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    return this.refreshTokenRepository.findOne({
      where: { token, isRevoked: false },
      relations: ['user', 'user.roles'],
    });
  }

  async findValidTokensByUserId(userId: string): Promise<RefreshToken[]> {
    return this.refreshTokenRepository.find({
      where: {
        user: { id: userId } as any,
        isRevoked: false,
        expiresAt: MoreThan(new Date()), // Tokens que ainda não expiraram
      },
      relations: ['user'],
    });
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { user: { id: userId } as any },
      { isRevoked: true }
    );
  }

  async deleteExpiredTokens(): Promise<void> {
    await this.refreshTokenRepository.delete({
      expiresAt: LessThan(new Date()),
    });
  }
} 