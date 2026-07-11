import { GetTriagePackageUseCase } from './get-triage-package-use-case';
import { ProcessTriageQrUseCase } from './process-triage-qr-use-case';

export const TRIAGE_USE_CASES = [
  GetTriagePackageUseCase,
  ProcessTriageQrUseCase,
];

export * from './get-triage-package-use-case';
export * from './process-triage-qr-use-case';
