import { GetTriageCollectionRequestUseCase } from './get-triage-collection-request-use-case';
import { ProcessTriageQrUseCase } from './process-triage-qr-use-case';

export const TRIAGE_USE_CASES = [
  GetTriageCollectionRequestUseCase,
  ProcessTriageQrUseCase,
];

export * from './get-triage-collection-request-use-case';
export * from './process-triage-qr-use-case';
