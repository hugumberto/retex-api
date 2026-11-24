import { Entity } from '../interfaces/entity.interface';

/** O que o posto está a fazer, segundo o próprio posto. */
export enum TriageStationStatus {
  // Sem pedido aberto (pode ter operador à espera do próximo).
  FREE = 'FREE',
  SORTING = 'SORTING',
  PAUSED = 'PAUSED',
}

/** Lote com peças mas ainda sem caixa lida, no passo "Caixas" do posto. */
export type PendingLot = { label: string; pieces: number };

/**
 * Posto de triagem (1, 2, 3…). O posto em ecrã inteiro diz à API quem lá está
 * e que pedido tem aberto; o painel de supervisão lê daqui. A supervisão pode
 * deixar um pedido atribuído a um posto: aparece no topo da fila desse posto.
 */
export interface TriageStation extends Entity {
  number: number;
  operatorId?: string | null;
  collectionRequestId?: string | null;
  assignedRequestId?: string | null;
  status: TriageStationStatus;
  // Quando o operador atual ocupou o posto.
  sessionStartedAt?: Date | null;
  // Último sinal do posto; sem sinal há uns minutos, o posto conta como livre.
  lastSeenAt?: Date | null;
  pendingLots?: PendingLot[] | null;
}

export enum TriageEventType {
  // Saco de outro pedido (ou desconhecido) lido no posto.
  WRONG_BAG = 'WRONG_BAG',
}

/** Ocorrência de um posto, para os alertas da supervisão. */
export interface TriageEvent extends Entity {
  station: number;
  type: TriageEventType;
  operatorId?: string | null;
  // Código lido (saco).
  code: string;
  // Pedido aberto no posto quando aconteceu.
  requestCode?: string | null;
  // Pedido a que o saco pertence, quando se sabe.
  otherRequestCode?: string | null;
}

/** Sem sinal há mais do que isto, o posto conta como livre (o posto dá sinal a cada minuto). */
export const STATION_STALE_MINUTES = 5;
