import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { ICryptoService } from '../../../services/interfaces/crypto.interface';
import { SERVICE_TOKENS } from '../../../services/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

interface UpdateMePasswordParam {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

@Injectable()
export class UpdateMePasswordUseCase implements IUseCase<UpdateMePasswordParam, void> {
  constructor(
    @Inject(DOMAIN_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(SERVICE_TOKENS.CRYPTO_SERVICE)
    private readonly cryptoService: ICryptoService,
  ) {}

  async call({ userId, currentPassword, newPassword }: UpdateMePasswordParam): Promise<void> {
    const user = await this.userRepository.findOne({ id: userId });
    if (!user) throw new NotFoundException('Utilizador não encontrado');
    const isValid = await this.cryptoService.comparePassword(currentPassword, user.password);
    if (!isValid) throw new BadRequestException('Palavra-passe actual incorrecta');
    const hashedPassword = await this.cryptoService.hashPassword(newPassword);
    await this.userRepository.update({ id: userId }, { password: hashedPassword });
  }
}
