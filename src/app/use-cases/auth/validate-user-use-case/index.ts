import { Inject, Injectable } from '@nestjs/common';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { User } from '../../../../domain/user/user.entity';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { ICryptoService } from '../../../services/interfaces/crypto.interface';
import { SERVICE_TOKENS } from '../../../services/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { ValidateUserDto } from './validate-user.dto';

@Injectable()
export class ValidateUserUseCase implements IUseCase<ValidateUserDto, User | null> {
  constructor(
    @Inject(DOMAIN_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(SERVICE_TOKENS.CRYPTO_SERVICE)
    private readonly cryptoService: ICryptoService,
  ) { }

  async call(param: ValidateUserDto): Promise<User | null> {
    const user = await this.userRepository.findOneWithRelations({ email: param.email });

    if (!user) {
      return null;
    }

    const isPasswordValid = await this.cryptoService.comparePassword(
      param.password,
      user.password
    );

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }
} 