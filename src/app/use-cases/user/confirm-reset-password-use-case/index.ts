import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { User } from '../../../../domain/user/user.entity';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { ICryptoService } from '../../../services/interfaces/crypto.interface';
import { SERVICE_TOKENS } from '../../../services/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { isTokenExpired } from '../activation-token.util';
import { ConfirmResetPasswordDto } from './confirm-reset-password.dto';

@Injectable()
export class ConfirmResetPasswordUseCase
  implements IUseCase<ConfirmResetPasswordDto, Omit<User, 'password'>> {
  constructor(
    @Inject(DOMAIN_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(SERVICE_TOKENS.CRYPTO_SERVICE)
    private readonly cryptoService: ICryptoService,
  ) {}

  async call(param: ConfirmResetPasswordDto): Promise<Omit<User, 'password'>> {
    const user = await this.userRepository.findOne({
      resetToken: param.token,
    } as Partial<User>);
    if (!user || isTokenExpired(user.resetTokenExpiresAt)) {
      throw new BadRequestException('Token de reset inválido ou expirado');
    }

    const hashedPassword = await this.cryptoService.hashPassword(param.password);

    const [updated] = await this.userRepository.update(
      { id: user.id } as Partial<User>,
      {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiresAt: null,
      } as Partial<User>,
    );

    const { password, ...userWithoutPassword } = updated;
    return userWithoutPassword;
  }
}
