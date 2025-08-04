import { Inject, Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { RefreshToken } from '../../../../domain/user/refresh-token.entity';
import { IRefreshTokenRepository } from '../../../../domain/user/refresh-token.repository';
import { User } from '../../../../domain/user/user.entity';
import { IUseCase } from '../../interfaces/use-case.interface';

@Injectable()
export class GenerateRefreshTokenUseCase implements IUseCase<User, RefreshToken> {
  constructor(
    @Inject(DOMAIN_TOKENS.REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) { }

  async call(user: User): Promise<RefreshToken> {
    // Gerar token aleatório
    const token = randomBytes(64).toString('hex');

    // Definir expiração (7 dias a partir de agora)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Criar refresh token
    const refreshToken: Partial<RefreshToken> = {
      token,
      user,
      expiresAt,
      isRevoked: false,
    };

    return this.refreshTokenRepository.create(refreshToken);
  }
} 