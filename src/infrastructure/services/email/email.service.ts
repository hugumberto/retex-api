import { Inject, Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { IEmailService, SendEmailOptions } from '../../../app/services/interfaces/email.interface';
import { EmailLogStatus } from '../../../domain/email-log/email-log.entity';
import { IEmailLogRepository } from '../../../domain/email-log/email-log.repository';
import { DOMAIN_TOKENS } from '../../../domain/tokens';
import { TemplateEngine } from './template.engine';

@Injectable()
export class EmailService implements IEmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly templateEngine = new TemplateEngine();

  constructor(
    @Inject(DOMAIN_TOKENS.EMAIL_LOG_REPOSITORY)
    private readonly emailLogRepository: IEmailLogRepository,
  ) {
    this.transporter = nodemailer.createTransport({
      host:  process.env.SMTP_HOST,
      port:  process.env.SMTP_PORT,
      auth: {
        user:  process.env.SMTP_USER,
        pass:  process.env.SMTP_PASS,
      },
    });
  }

  async send(options: SendEmailOptions): Promise<void> {
    const html = this.templateEngine.render(options.template, options.context);

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: options.to,
        subject: options.subject,
        html,
      });

      this.logger.log(`Email "${options.subject}" enviado para ${options.to}`);
      await this.logEmail(options, EmailLogStatus.SENT);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.logEmail(options, EmailLogStatus.FAILED, message);
      throw error;
    }
  }

  // Registo do email (email_log). Best-effort: uma falha a registar nunca deve
  // quebrar ou mascarar o envio.
  private async logEmail(
    options: SendEmailOptions,
    status: EmailLogStatus,
    error?: string,
  ): Promise<void> {
    try {
      await this.emailLogRepository.create({
        type: options.meta?.type ?? options.template,
        subject: options.subject,
        recipient: options.to,
        userId: options.meta?.userId ?? null,
        status,
        error: error ?? null,
        sentAt: new Date(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Falha ao registar email_log: ${message}`);
    }
  }
}
