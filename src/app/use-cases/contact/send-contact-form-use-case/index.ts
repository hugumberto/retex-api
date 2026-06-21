import { Inject, Injectable } from '@nestjs/common';
import { IEmailService } from '../../../services/interfaces/email.interface';
import { SERVICE_TOKENS } from '../../../services/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { SendContactFormDto } from './send-contact-form.dto';

@Injectable()
export class SendContactFormUseCase
  implements IUseCase<SendContactFormDto, { ok: true }>
{
  constructor(
    @Inject(SERVICE_TOKENS.EMAIL_SERVICE)
    private readonly emailService: IEmailService,
  ) {}

  async call(dto: SendContactFormDto): Promise<{ ok: true }> {
    const to = process.env.CONTACT_EMAIL ?? 'geral@retex.pt';

    await this.emailService.send({
      to,
      subject: `Contacto: ${dto.title} — ${dto.name}`,
      template: 'contact-form',
      context: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        // Não usar a chave `title`: colide com o hash `title` do partial `layout`.
        contactTitle: dto.title,
        message: dto.message,
        year: new Date().getFullYear(),
      },
    });

    return { ok: true };
  }
}
