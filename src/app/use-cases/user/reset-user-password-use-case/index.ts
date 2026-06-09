import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { User } from '../../../../domain/user/user.entity';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { ICryptoService } from '../../../services/interfaces/crypto.interface';
import { SERVICE_TOKENS } from '../../../services/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { ResetUserPasswordDto } from './reset-user-password.dto';

@Injectable()
export class ResetUserPasswordUseCase
  implements IUseCase<ResetUserPasswordDto, Omit<User, 'password'>>
{
  constructor(
    @Inject(DOMAIN_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(SERVICE_TOKENS.CRYPTO_SERVICE)
    private readonly cryptoService: ICryptoService,
  ) {}

  async call(param: ResetUserPasswordDto): Promise<Omit<User, 'password'>> {
    const { email, password: newPassword } = param;

    const existingUser = await this.userRepository.findOne({ email });
    if (!existingUser) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const hashedPassword = await this.cryptoService.hashPassword(newPassword);
    const [updatedUser] = await this.userRepository.update(
      { id: existingUser.id },
      { password: hashedPassword },
    );

    const { password: _password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }
}
