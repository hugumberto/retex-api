import { Inject, Injectable, Logger } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import * as nodemailer from 'nodemailer';
import { IEmailService, SendEmailOptions } from '../../../app/services/interfaces/email.interface';
import { normalizeLanguage } from '../../../config/i18n.constants';
import { EmailLogStatus } from '../../../domain/email-log/email-log.entity';
import { IEmailLogRepository } from '../../../domain/email-log/email-log.repository';
import { DOMAIN_TOKENS } from '../../../domain/tokens';
import { TemplateEngine } from './template.engine';

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * Escapa os valores interpolados nas traduções.
 *
 * O helper `{{t}}` devolve SafeString porque as próprias traduções contêm
 * markup nosso (<strong>, <br/>). Os valores que lá entram, esses, vêm de dados
 * de utilizador (nome, cidade, motivo de cancelamento) e sem escape poderiam
 * injetar HTML — por exemplo um link de phishing dentro de um email legítimo
 * da Retex. Escapamos só os valores, preservando o markup das traduções.
 *
 * Não afeta o `{{campo}}` direto nos templates: esse usa `options.context` e já
 * é escapado pelo handlebars.
 */
function escapeArgs(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
  }
  if (Array.isArray(value)) {
    return value.map(escapeArgs);
  }
  // Só objetos simples — Date e afins passam intactos para o i18n os formatar.
  if (value?.constructor === Object) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        escapeArgs(item),
      ]),
    );
  }
  return value;
}

@Injectable()
export class EmailService implements IEmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly templateEngine = new TemplateEngine();

  constructor(
    @Inject(DOMAIN_TOKENS.EMAIL_LOG_REPOSITORY)
    private readonly emailLogRepository: IEmailLogRepository,
    private readonly i18n: I18nService,
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
    const lang = normalizeLanguage(options.locale);
    // Cada template tem o seu namespace em `email.<template>`, o que permite
    // usar as mesmas chaves curtas ({{t "greeting"}}) em todos eles.
    const translate = (key: string, args?: Record<string, unknown>): string =>
      this.i18n.translate(`email.${options.template}.${key}`, {
        lang,
        args: escapeArgs({ ...options.context, ...args }) as Record<
          string,
          unknown
        >,
      }) as unknown as string;

    const subject = options.subject ?? translate('subject');
    const html = this.templateEngine.render(
      options.template,
      { ...options.context, lang },
      translate,
    );

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: options.to,
        ...(options.cc?.length ? { cc: options.cc } : {}),
        subject,
        html,
      });

      this.logger.log(`Email "${subject}" enviado para ${options.to}`);
      await this.logEmail(options, subject, EmailLogStatus.SENT);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.logEmail(options, subject, EmailLogStatus.FAILED, message);
      throw error;
    }
  }

  // Registo do email (email_log). Best-effort: uma falha a registar nunca deve
  // quebrar ou mascarar o envio.
  private async logEmail(
    options: SendEmailOptions,
    subject: string,
    status: EmailLogStatus,
    error?: string,
  ): Promise<void> {
    try {
      await this.emailLogRepository.create({
        type: options.meta?.type ?? options.template,
        subject,
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
