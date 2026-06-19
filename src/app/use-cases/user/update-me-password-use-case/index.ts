import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { ICryptoService } from '../../../services/interfaces/crypto.interface';
import { SERVICE_TOKENS } from '../../../services/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

@Injectable()
export class UpdateMePasswordUseCase implements IUseCase<{ userId: string; newPassword: string }, void> {
  constructor(
    @Inject(DOMAIN_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(SERVICE_TOKENS.CRYPTO_SERVICE)
    private readonly cryptoService: ICryptoService,
  ) {}

  async call({ userId, newPassword }: { userId: string; newPassword: string }): Promise<void> {
    const user = await this.userRepository.findOne({ id: userId });
    if (!user) throw new NotFoundException('Utilizador não encontrado');
    const hashedPassword = await this.cryptoService.hashPassword(newPassword);
    await this.userRepository.update({ id: userId }, { password: hashedPassword });
  }
}
