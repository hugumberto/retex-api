import { DATE_LOCALE, normalizeLanguage } from '../../../config/i18n.constants';
import { CollectionRequest } from '../../../domain/collection-request/collection-request.entity';
import { SendEmailOptions } from '../../services/interfaces/email.interface';

/**
 * Lembrete enviado na véspera da recolha ao cliente que já confirmou a sua
 * solicitação. É meramente informativo — não inclui ações de confirmar ou
 * cancelar, porque nesta fase a solicitação já não pode ser cancelada pelo
 * cliente. Espera `pkg` com `user`, `route` e (opcionalmente) `address`.
 */
export function buildCollectionReminderEmail(
  pkg: CollectionRequest,
  cc: string[] = [],
): SendEmailOptions {
  // A data sai no formato do idioma do destinatário, tal como no email de
  // confirmação de coleta.
  const language = normalizeLanguage(pkg.user.language);
  const collectionDate = new Date(pkg.route.startDate).toLocaleDateString(
    DATE_LOCALE[language],
  );

  return {
    to: pkg.user.email,
    cc,
    template: 'collection-reminder',
    locale: language,
    context: {
      firstName: pkg.user.firstName,
      lastName: pkg.user.lastName,
      friendlyCode: pkg.friendlyCode,
      collectionDate,
      collectionInterval: pkg.route.collectionInterval,
      address: pkg.address,
      year: new Date().getFullYear(),
    },
    meta: { type: 'collection-reminder', userId: pkg.user.id },
  };
}
