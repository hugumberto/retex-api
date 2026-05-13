import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { IEmailService, SendEmailOptions } from '../../../app/services/interfaces/email.interface';
import { TemplateEngine } from './template.engine';

@Injectable()
export class EmailService implements IEmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly templateEngine = new TemplateEngine();

  constructor() {
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

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: options.to,
      subject: options.subject,
      html,
    });

    this.logger.log(`Email "${options.subject}" enviado para ${options.to}`);
  }
}
