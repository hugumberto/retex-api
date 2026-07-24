import { Inject, Injectable, Logger } from '@nestjs/common';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { User } from '../../../../domain/user/user.entity';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { IEmailService } from '../../../services/interfaces/email.interface';
import { SERVICE_TOKENS } from '../../../services/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { buildPasswordResetEmail } from '../activation-email';
import { generateResetToken } from '../activation-token.util';
import { ForgotPasswordDto } from './forgot-password.dto';

export interface ForgotPasswordResult {
  ok: true;
  // true quando o utilizador está fora da zona de atuação: não enviamos reset;
  // o frontend informa que receberá um email quando passarmos a atuar na zona.
  outOfZone: boolean;
}

@Injectable()
export class ForgotPasswordUseCase
  implements IUseCase<ForgotPasswordDto, ForgotPasswordResult>
{
  private readonly logger = new Logger(ForgotPasswordUseCase.name);

  constructor(
    @Inject(DOMAIN_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(SERVICE_TOKENS.EMAIL_SERVICE)
    private readonly emailService: IEmailService,
  ) {}

  async call({ email }: ForgotPasswordDto): Promise<ForgotPasswordResult> {
    // Carrega o utilizador com os endereços para avaliar a zona de atuação.
    const [user] = await this.userRepository.findWithRelations({ email });

    // Anti-enumeração: para email inexistente respondemos de forma genérica
    // (sem revelar que não existe) e sem enviar nada.
    if (!user) {
      return { ok: true, outOfZone: false };
    }

    // Fora da zona: tem endereços mas nenhum dentro da zona de atuação. Estes
    // utilizadores ainda não têm conta ativa — não faz sentido repor a senha.
    const addresses = user.addresses ?? [];
    const outOfZone =
      addresses.length > 0 && !addresses.some((a) => a.isInServiceZone);

    if (outOfZone) {
      return { ok: true, outOfZone: true };
    }

    const { token, expiresAt } = generateResetToken();
    await this.userRepository.update(
      { id: user.id } as Partial<User>,
      {
        resetToken: token,
        resetTokenExpiresAt: expiresAt,
      } as Partial<User>,
    );

    this.emailService
      .send(buildPasswordResetEmail(user, token))
      .catch((err) =>
        this.logger.error(
          `Falha ao enviar email de reset para ${user.email}: ${err.message}`,
        ),
      );

    return { ok: true, outOfZone: false };
  }
}
