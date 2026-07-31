export interface SendEmailMeta {
  // Tipo do email para o log; se omitido, usa-se o `template`.
  type?: string;
  // Utilizador associado ao email, quando conhecido no ponto de disparo.
  userId?: string;
}

export interface SendEmailOptions {
  to: string;
  template: string;
  context: Record<string, unknown>;
  /**
   * Idioma do destinatário (pt, en, es, fr). Vem normalmente de `user.language`.
   * Sem ele, o email sai em português.
   */
  locale?: string;
  /**
   * Assunto já resolvido. Só é preciso quando o assunto não é traduzível
   * (ex.: o email interno do formulário de contacto, que inclui dados do
   * remetente). Caso contrário usa-se `email.<template>.subject`.
   */
  subject?: string;
  // Metadados opcionais para o registo (email_log). Não afetam o envio.
  meta?: SendEmailMeta;
}

export interface IEmailService {
  send(options: SendEmailOptions): Promise<void>;
}
