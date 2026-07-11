import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProcessCollectionSchedulesUseCase } from '../../use-cases/collection/process-collection-schedules-use-case';

@Injectable()
export class CollectionSchedulerService {
  private readonly logger = new Logger(CollectionSchedulerService.name);

  constructor(
    private readonly processCollectionSchedules: ProcessCollectionSchedulesUseCase,
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
}
