import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CollectionSchedulerService } from './collection-scheduler.service';

// Registrado no app.module apenas fora do ambiente de teste.
// O use-case de processamento vem do UseCasesModule (global).
@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [CollectionSchedulerService],
})
export class SchedulerModule { }
