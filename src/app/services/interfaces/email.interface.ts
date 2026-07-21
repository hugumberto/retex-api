export interface SendEmailMeta {
  // Tipo do email para o log; se omitido, usa-se o `template`.
  type?: string;
  // Utilizador associado ao email, quando conhecido no ponto de disparo.
  userId?: string;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  template: string;
  context: Record<string, unknown>;
  // Metadados opcionais para o registo (email_log). Não afetam o envio.
  meta?: SendEmailMeta;
}

export interface IEmailService {
  send(options: SendEmailOptions): Promise<void>;
}
