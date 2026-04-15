export interface SendEmailOptions {
  to: string;
  subject: string;
  template: string;
  context: Record<string, unknown>;
}

export interface IEmailService {
  send(options: SendEmailOptions): Promise<void>;
}
