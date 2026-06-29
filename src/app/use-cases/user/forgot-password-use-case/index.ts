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

@Injectable()
export class ForgotPasswordUseCase implements IUseCase<ForgotPasswordDto, { ok: true }> {
  private readonly logger = new Logger(ForgotPasswordUseCase.name);

  constructor(
    @Inject(DOMAIN_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(SERVICE_TOKENS.EMAIL_SERVICE)
    private readonly emailService: IEmailService,
  ) {}

  async call({ email }: ForgotPasswordDto): Promise<{ ok: true }> {
    const user = await this.userRepository.findOne({ email });

    // Anti-enumeração: respondemos sempre de forma genérica. Só enviamos o
    // email quando o utilizador existe.
    if (user) {
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
    }

    return { ok: true };
  }
}
