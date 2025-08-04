import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IRefreshTokenRepository } from '../../../../domain/user/refresh-token.repository';
import { IUseCase } from '../../interfaces/use-case.interface';
import { LogoutDto } from './logout.dto';

@Injectable()
export class LogoutUseCase implements IUseCase<LogoutDto, void> {
  constructor(
    @Inject(DOMAIN_TOKENS.REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) { }

  async call(param: LogoutDto): Promise<void> {
    // Buscar refresh token
    const refreshToken = await this.refreshTokenRepository.findByToken(param.refresh_token);

    if (!refreshToken) {
      throw new NotFoundException('Refresh token não encontrado');
    }

    // Revogar o token
    await this.refreshTokenRepository.update(
      { id: refreshToken.id },
      { isRevoked: true }
    );
  }
} 