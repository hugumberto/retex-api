import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProcessCollectionSchedulesUseCase } from '../../use-cases/collection/process-collection-schedules-use-case';
import { SendCollectionRemindersUseCase } from '../../use-cases/collection/send-collection-reminders-use-case';

@Injectable()
export class CollectionSchedulerService {
  private readonly logger = new Logger(CollectionSchedulerService.name);

  constructor(
    private readonly processCollectionSchedules: ProcessCollectionSchedulesUseCase,
    private readonly sendCollectionReminders: SendCollectionRemindersUseCase,
  ) { }

  // Diariamente às 03:00.
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handle(): Promise<void> {
    try {
      const result = await this.processCollectionSchedules.call();
      this.logger.log(
        `Agenda de coleta processada: ${result.removedFromRoute} removidas por prazo, ${result.movedToWaiting} para WAITING_FOR_COLLECTION`,
      );
    } catch (err) {
      this.logger.error(`Falha ao processar agenda de coleta: ${err.message}`);
    }
  }

  // Diariamente às 09:00 — lembrete aos clientes cuja recolha é no dia seguinte.
  // Hora escolhida para o email chegar num momento em que o cliente o vê.
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleReminders(): Promise<void> {
    try {
      const result = await this.sendCollectionReminders.call();
      this.logger.log(
        `Lembretes de recolha: ${result.sent} enviados, ${result.failed} falharam`,
      );
    } catch (err) {
      this.logger.error(`Falha ao enviar lembretes de recolha: ${err.message}`);
    }
  }
}
