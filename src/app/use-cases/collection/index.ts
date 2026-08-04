import { BindQrCodeUseCase } from './bind-qr-code-use-case';
import { CancelCollectionUseCase } from './cancel-collection-use-case';
import { FinalizeCollectionUseCase } from './finalize-collection-use-case';
import { ProcessCollectionSchedulesUseCase } from './process-collection-schedules-use-case';
import { SendCollectionRemindersUseCase } from './send-collection-reminders-use-case';

export const COLLECTION_USE_CASES = [
  BindQrCodeUseCase,
  FinalizeCollectionUseCase,
  CancelCollectionUseCase,
  ProcessCollectionSchedulesUseCase,
  SendCollectionRemindersUseCase,
];

export * from './bind-qr-code-use-case';
export * from './cancel-collection-use-case';
export * from './finalize-collection-use-case';
export * from './process-collection-schedules-use-case';
export * from './send-collection-reminders-use-case';
