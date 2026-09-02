import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { User } from '../../../../domain/user/user.entity';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { ICryptoService } from '../../../services/interfaces/crypto.interface';
import { SERVICE_TOKENS } from '../../../services/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { assertCanManageUser } from '../user-management.policy';
import { ResetUserPasswordParamDto } from './reset-user-password-param.dto';

@Injectable()
export class ResetUserPasswordUseCase
  implements IUseCase<ResetUserPasswordParamDto, Omit<User, 'password'>>
{
  constructor(
    @Inject(DOMAIN_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(SERVICE_TOKENS.CRYPTO_SERVICE)
    private readonly cryptoService: ICryptoService,
  ) {}

  async call(param: ResetUserPasswordParamDto): Promise<Omit<User, 'password'>> {
    const { data, actor } = param;
    const { email, password: newPassword } = data;

    // Com relações: repor a senha de um ADMIN/MASTER é exclusivo do MASTER.
    const existingUser = await this.userRepository.findOneWithRelations({ email });
    if (!existingUser) {
      throw new NotFoundException('errors.user.notFound');
    }

    assertCanManageUser(actor, existingUser);

    const hashedPassword = await this.cryptoService.hashPassword(newPassword);
    const [updatedUser] = await this.userRepository.update(
      { id: existingUser.id },
      { password: hashedPassword },
    );

    const { password: _password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }
}
