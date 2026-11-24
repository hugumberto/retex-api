import { AssignTriageStationUseCase } from './assign-triage-station-use-case';
import { GetTriageExportUseCase } from './get-triage-export-use-case';
import { GetTriageOverviewUseCase } from './get-triage-overview-use-case';
import { GetTriageQueueUseCase } from './get-triage-queue-use-case';
import { ProcessTriageQrUseCase } from './process-triage-qr-use-case';
import { RecordTriageEventUseCase } from './record-triage-event-use-case';
import { UpdateTriageStationUseCase } from './update-triage-station-use-case';

export const TRIAGE_USE_CASES = [
  ProcessTriageQrUseCase,
  GetTriageQueueUseCase,
  GetTriageOverviewUseCase,
  GetTriageExportUseCase,
  UpdateTriageStationUseCase,
  AssignTriageStationUseCase,
  RecordTriageEventUseCase,
];

export * from './assign-triage-station-use-case';
export * from './get-triage-export-use-case';
export * from './get-triage-overview-use-case';
export * from './get-triage-queue-use-case';
export * from './process-triage-qr-use-case';
export * from './record-triage-event-use-case';
export * from './update-triage-station-use-case';
