import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { UserStatus } from '../../../../domain/user/user-status.enum';
import { User } from '../../../../domain/user/user.entity';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { IEmailService } from '../../../services/interfaces/email.interface';
import { SERVICE_TOKENS } from '../../../services/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { buildActivationEmail } from '../activation-email';
import { generateActivationToken } from '../activation-token.util';
import { SendActivationEmailDto } from './send-activation-email.dto';

/**
 * Envia (ou reenvia) o email de ativação a um utilizador existente para que ele
 * defina/redefina a própria senha pelo fluxo de ativação. Usado pelo admin no
 * portal em vez de definir a senha manualmente.
 */
@Injectable()
export class SendActivationEmailUseCase
  implements IUseCase<SendActivationEmailDto, { ok: true }>
{
  constructor(
    @Inject(DOMAIN_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(SERVICE_TOKENS.EMAIL_SERVICE)
    private readonly emailService: IEmailService,
  ) {}

  async call({ email }: SendActivationEmailDto): Promise<{ ok: true }> {
    const user = await this.userRepository.findOne({ email } as Partial<User>);
    if (!user) {
      throw new NotFoundException('Utilizador não encontrado');
    }

    const { token, expiresAt } = generateActivationToken();

    // Conta passa a INATIVA para permitir a (re)definição da senha pelo fluxo de
    // ativação; o token fica guardado para validar o link do email.
    await this.userRepository.update(
      { id: user.id } as Partial<User>,
      {
        activationToken: token,
        activationTokenExpiresAt: expiresAt,
        // Ativações iniciadas pelo admin no portal ignoram a regra de zona.
        activationBypassZone: true,
        status: UserStatus.INACTIVE,
      } as Partial<User>,
    );

    await this.emailService.send(buildActivationEmail(user, token));

    return { ok: true };
  }
}
