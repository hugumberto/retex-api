import { SendEmailOptions } from '../../services/interfaces/email.interface';
import { User } from '../../../domain/user/user.entity';

/**
 * Email ao cliente informando que a recolha da sua solicitação foi cancelada
 * pelo motorista, com o motivo (comentário).
 */
export function buildCollectionCancelledEmail(
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'language'>,
  reason: string,
  friendlyCode?: string | null,
): SendEmailOptions {
  return {
    to: user.email,
    template: 'collection-cancelled',
    locale: user.language,
    context: {
      firstName: user.firstName,
      lastName: user.lastName,
      reason,
      friendlyCode,
      year: new Date().getFullYear(),
    },
    meta: { type: 'collection-cancelled', userId: user.id },
  };
}
