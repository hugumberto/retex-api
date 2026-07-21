import { Entity } from '../interfaces/entity.interface';

export enum EmailLogStatus {
  SENT = 'SENT',
  FAILED = 'FAILED',
}

export interface EmailLog extends Entity {
  // Tipo do email — normalmente o identificador do template (ex.: 'survey',
  // 'account-activation', 'collection-confirmation').
  type: string;
  subject: string;
  // Email do destinatário.
  recipient: string;
  // Utilizador associado, quando conhecido no ponto de disparo.
  userId?: string | null;
  status: EmailLogStatus;
  // Mensagem de erro quando status = FAILED.
  error?: string | null;
  sentAt: Date;
}
