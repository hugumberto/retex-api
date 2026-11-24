import { IRepository } from '../interfaces/repository.interface';
import { PendingLot, TriageEvent, TriageStation, TriageStationStatus } from './triage-station.entity';

/** Uma linha da tabela "Postos de triagem". */
export type TriageStationRow = {
  number: number;
  status: TriageStationStatus;
  lastSeenAt: Date | null;
  sessionStartedAt: Date | null;
  operatorId: string | null;
  operatorName: string | null;
  request: {
    id: string;
    code: string | null;
    clientName: string | null;
    bags: number;
    bagsProcessed: number;
    pieces: number;
  } | null;
  assigned: { id: string; code: string | null } | null;
  pendingLots: PendingLot[];
  // Peças registadas neste posto pelo operador atual desde `since` (ritmo).
  recentPieces: number;
};

export type TriageDayStats = {
  pieces: number;
  accessories: number;
  // Soma do peso dos sacos fechados na triagem no período.
  weight: number;
  // Peças dos sacos com peso (para o kg por peça).
  piecesOfWeighedBags: number;
  requestsDone: number;
  lastDoneAt: Date | null;
  destinations: { destination: string; pieces: number }[];
};

/** Uma linha do CSV do dia: uma peça (ou grupo de peças iguais) registada. */
export type TriageExportRow = {
  createdAt: Date;
  station: number | null;
  operatorName: string | null;
  requestCode: string | null;
  clientName: string | null;
  bagCode: string | null;
  quantity: number;
  destination: string;
  category: string | null;
  condition: string | null;
  sex: string | null;
  ageGroup: string | null;
  season: string | null;
  brand: string | null;
  storageUnitCode: string | null;
};

export interface ITriageStationRepository extends IRepository<TriageStation> {
  findByNumber(number: number): Promise<TriageStation | null>;
  /** Tira o operador de todos os postos menos `keep` (um operador, um posto). */
  releaseOperator(operatorId: string, keep: number): Promise<void>;
  /** Tira a atribuição deste pedido de todos os postos menos `keep`. */
  clearAssignment(collectionRequestId: string, keep?: number): Promise<void>;
  /** Postos com a informação do pedido aberto; ritmo contado desde `rhythmSince`. */
  rows(rhythmSince: Date): Promise<TriageStationRow[]>;
  dayStats(since: Date): Promise<TriageDayStats>;
  /** Média de peças por dia nos últimos `days` dias com triagem (sem hoje). */
  averageDailyPieces(today: Date, days: number): Promise<number | null>;
  exportRows(since: Date, until: Date): Promise<TriageExportRow[]>;

  recordEvent(event: Omit<TriageEvent, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<void>;
  eventsSince(since: Date, limit: number): Promise<TriageEvent[]>;
}
