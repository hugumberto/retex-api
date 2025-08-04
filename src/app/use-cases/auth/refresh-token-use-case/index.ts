import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IRefreshTokenRepository } from '../../../../domain/user/refresh-token.repository';
import { RefreshTokenResult } from '../../../services/interfaces/auth.interface';
import { IUseCase } from '../../interfaces/use-case.interface';
import { GenerateJwtUseCase } from '../generate-jwt-use-case';
import { GenerateRefreshTokenUseCase } from '../generate-refresh-token-use-case';
import { RefreshTokenDto } from './refresh-token.dto';

@Injectable()
export class RefreshTokenUseCase implements IUseCase<RefreshTokenDto, RefreshTokenResult> {
  constructor(
    @Inject(DOMAIN_TOKENS.REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly generateJwtUseCase: GenerateJwtUseCase,
    private readonly generateRefreshTokenUseCase: GenerateRefreshTokenUseCase,
  ) { }

  async call(param: RefreshTokenDto): Promise<RefreshTokenResult> {
    // Buscar refresh token
    const refreshToken = await this.refreshTokenRepository.findByToken(param.refresh_token);

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    // Verificar se não está expirado
    if (refreshToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expirado');
    }

    // Verificar se não foi revogado
    if (refreshToken.isRevoked) {
      throw new UnauthorizedException('Refresh token revogado');
    }

    // Revogar o token atual
    await this.refreshTokenRepository.update(
      { id: refreshToken.id },
      { isRevoked: true }
    );

    // Gerar novo access token
    const loginResult = await this.generateJwtUseCase.call(refreshToken.user);

    // Gerar novo refresh token
    const newRefreshToken = await this.generateRefreshTokenUseCase.call(refreshToken.user);

    return {
      access_token: loginResult.access_token,
      refresh_token: newRefreshToken.token,
    };
  }
} 