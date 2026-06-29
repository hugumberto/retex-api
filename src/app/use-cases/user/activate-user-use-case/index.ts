import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Address } from '../../../../domain/address/address.entity';
import { IAddressRepository } from '../../../../domain/address/address.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { UserStatus } from '../../../../domain/user/user-status.enum';
import { User } from '../../../../domain/user/user.entity';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { ICryptoService } from '../../../services/interfaces/crypto.interface';
import { SERVICE_TOKENS } from '../../../services/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { isActivationTokenValid } from '../activation-token.util';
import { ActivateUserDto } from './activate-user.dto';

@Injectable()
export class ActivateUserUseCase
  implements IUseCase<ActivateUserDto, Omit<User, 'password'>> {
  constructor(
    @Inject(DOMAIN_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(DOMAIN_TOKENS.ADDRESS_REPOSITORY)
    private readonly addressRepository: IAddressRepository,
    @Inject(SERVICE_TOKENS.CRYPTO_SERVICE)
    private readonly cryptoService: ICryptoService,
  ) {}

  async call(param: ActivateUserDto): Promise<Omit<User, 'password'>> {
    const user = await this.userRepository.findByActivationToken(param.token);
    if (!user) {
      throw new NotFoundException('Token de ativação inválido');
    }

    if (user.status === UserStatus.ACTIVE) {
      throw new ConflictException('Conta já ativada');
    }

    if (!isActivationTokenValid(user)) {
      throw new BadRequestException('Token de ativação expirado');
    }

    // Defesa: garantir que o utilizador continua elegível (zona pode ter mudado).
    // Ativações iniciadas pelo admin no portal (activationBypassZone) ignoram
    // esta regra; o fluxo de registo normal continua a exigir endereço em zona.
    if (!user.activationBypassZone) {
      const addresses = await this.addressRepository.find({
        userId: user.id,
        isDefault: true,
      } as Partial<Address>);
      const defaultAddress = addresses[0];
      if (!defaultAddress?.isInServiceZone) {
        throw new BadRequestException('Endereço fora da zona de atuação');
      }
    }

    const hashedPassword = await this.cryptoService.hashPassword(param.password);

    const [updated] = await this.userRepository.update(
      { id: user.id } as Partial<User>,
      {
        password: hashedPassword,
        status: UserStatus.ACTIVE,
        activationToken: null,
        activationTokenExpiresAt: null,
        activationBypassZone: false,
      } as Partial<User>,
    );

    const { password, ...userWithoutPassword } = updated;
    return userWithoutPassword;
  }
}
