import { GetTriageQueueUseCase } from './get-triage-queue-use-case';
import { ProcessTriageQrUseCase } from './process-triage-qr-use-case';

export const TRIAGE_USE_CASES = [
  ProcessTriageQrUseCase,
  GetTriageQueueUseCase,
];

export * from './get-triage-queue-use-case';
export * from './process-triage-qr-use-case';
