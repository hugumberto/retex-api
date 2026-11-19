import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { LoginResult } from '../../../services/interfaces/auth.interface';
import { IUseCase } from '../../interfaces/use-case.interface';
import { GenerateJwtUseCase } from '../generate-jwt-use-case';
import { GenerateRefreshTokenUseCase } from '../generate-refresh-token-use-case';
import { ValidateUserUseCase } from '../validate-user-use-case';
import { LoginDto } from './login.dto';

@Injectable()
export class LoginUseCase implements IUseCase<LoginDto, LoginResult> {
  private readonly logger = new Logger(LoginUseCase.name);

  constructor(
    @Inject(DOMAIN_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly validateUserUseCase: ValidateUserUseCase,
    private readonly generateJwtUseCase: GenerateJwtUseCase,
    private readonly generateRefreshTokenUseCase: GenerateRefreshTokenUseCase,
  ) { }

  async call(param: LoginDto): Promise<LoginResult> {
    const user = await this.validateUserUseCase.call(param);

    if (!user) {
      throw new UnauthorizedException('errors.auth.invalidCredentials');
    }

    // Último acesso, para "Última atividade" em Utilizadores. Uma falha aqui
    // não impede a entrada.
    await this.userRepository
      .touchLastLogin(user.id)
      .catch((error) => this.logger.warn(`lastLoginAt não gravado: ${error}`));

    // Gerar JWT access token
    const jwtResult = await this.generateJwtUseCase.call(user);

    // Gerar refresh token
    const refreshToken = await this.generateRefreshTokenUseCase.call(user);

    return {
      access_token: jwtResult.access_token,
      refresh_token: refreshToken.token,
      user: jwtResult.user,
    };
  }
} 