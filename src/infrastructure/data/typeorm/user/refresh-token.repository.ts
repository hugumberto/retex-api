import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, MoreThan, Repository } from 'typeorm';
import { ILocalStorageService } from '../../../../app/services/local-storage/local-storage.service';
import { SERVICE_TOKENS } from '../../../../app/services/tokens';
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
    refreshTokenRepository: Repository<RefreshToken>,
    @Inject(SERVICE_TOKENS.LOCAL_STORAGE_SERVICE)
    localStorageService: ILocalStorageService,
  ) {
    super(refreshTokenRepository, localStorageService);
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    const repository = await this.getRepository();
    return repository.findOne({
      where: { token, isRevoked: false },
      relations: ['user', 'user.roles'],
    });
  }

  async findValidTokensByUserId(userId: string): Promise<RefreshToken[]> {
    const repository = await this.getRepository();
    return repository.find({
      where: {
        user: { id: userId } as any,
        isRevoked: false,
        expiresAt: MoreThan(new Date()), // Tokens que ainda não expiraram
      },
      relations: ['user'],
    });
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    const repository = await this.getRepository();
    await repository.update(
      { user: { id: userId } as any },
      { isRevoked: true }
    );
  }

  async deleteExpiredTokens(): Promise<void> {
    const repository = await this.getRepository();
    await repository.delete({
      expiresAt: LessThan(new Date()),
    });
  }
} 