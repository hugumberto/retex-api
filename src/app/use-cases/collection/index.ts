import { BindQrCodeUseCase } from './bind-qr-code-use-case';
import { CancelCollectionUseCase } from './cancel-collection-use-case';
import { FinalizeCollectionUseCase } from './finalize-collection-use-case';
import { GetCollectionUseCase } from './get-collection-use-case';
import { ProcessCollectionSchedulesUseCase } from './process-collection-schedules-use-case';

export const COLLECTION_USE_CASES = [
  GetCollectionUseCase,
  BindQrCodeUseCase,
  FinalizeCollectionUseCase,
  CancelCollectionUseCase,
  ProcessCollectionSchedulesUseCase,
];

export * from './bind-qr-code-use-case';
export * from './cancel-collection-use-case';
export * from './finalize-collection-use-case';
export * from './get-collection-use-case';
export * from './process-collection-schedules-use-case';
