import { Inject, Injectable, Logger } from '@nestjs/common';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IEmailService } from '../../../services/interfaces/email.interface';
import { SERVICE_TOKENS } from '../../../services/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { buildCollectionReminderEmail } from '../collection-reminder-email';

export interface SendCollectionRemindersResult {
  sent: number;
  failed: number;
}

/**
 * Executado diariamente pelo scheduler (09:00): envia o lembrete da véspera a
 * todos os clientes que já confirmaram uma recolha marcada para o dia seguinte,
 * em rotas WAITING_TO_START ou IN_TRANSIT.
 *
 * Cada envio bem-sucedido marca `collectionReminderSentAt`, o que garante um
 * único lembrete por solicitação mesmo que o cron dispare em várias réplicas da
 * API (não há lock/leader election) ou que o disparo manual seja repetido.
 */
@Injectable()
export class SendCollectionRemindersUseCase
  implements IUseCase<void, SendCollectionRemindersResult>
{
  private readonly logger = new Logger(SendCollectionRemindersUseCase.name);

  constructor(
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY)
    private readonly collectionRequestRepository: ICollectionRequestRepository,
    @Inject(SERVICE_TOKENS.EMAIL_SERVICE)
    private readonly emailService: IEmailService,
  ) { }

  async call(): Promise<SendCollectionRemindersResult> {
    const pending =
      await this.collectionRequestRepository.findPendingCollectionReminders();

    let sent = 0;
    let failed = 0;

    for (const pkg of pending) {
      if (!pkg.user?.email || !pkg.route?.startDate) {
        continue;
      }

      try {
        await this.emailService.send(buildCollectionReminderEmail(pkg));
        // Só marcamos depois do envio: se o SMTP falhar, o registo fica por
        // enviar e a falha fica visível no email_log.
        await this.collectionRequestRepository.update(
          { id: pkg.id },
          { collectionReminderSentAt: new Date() },
        );
        sent++;
      } catch (err) {
        // Uma falha não interrompe o lote — os restantes clientes continuam.
        const message = err instanceof Error ? err.message : String(err);
        failed++;
        this.logger.error(
          `Falha ao enviar lembrete de recolha para ${pkg.user.email}: ${message}`,
        );
      }
    }

    return { sent, failed };
  }
}
