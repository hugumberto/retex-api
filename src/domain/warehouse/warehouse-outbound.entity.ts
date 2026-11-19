import { Entity } from '../interfaces/entity.interface';
import { StorageUnit } from '../storage-unit/storage-unit.entity';

/** Para onde vai o que sai do armazém. */
export enum OutboundType {
  RECYCLING = 'RECYCLING',
  DONATION = 'DONATION',
  UPCYCLING = 'UPCYCLING',
  SALE = 'SALE',
}

export enum OutboundStatus {
  SCHEDULED = 'SCHEDULED',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
}

/**
 * Saída programada do armazém (fardos para reciclagem, doação, envio para
 * upcycling, venda). Pode levar lotes: ao marcar como feita, esses lotes ficam
 * inativos e deixam de contar na ocupação da zona.
 */
export interface WarehouseOutbound extends Entity {
  type: OutboundType;
  // Parceiro ou sítio ("Loja social · Maia").
  destination: string;
  // Dia previsto (YYYY-MM-DD).
  scheduledDate: string;
  // Sem lotes, o que se escreveu; com lotes, a soma deles quando sai.
  weight?: number | null;
  pieces?: number | null;
  notes?: string | null;
  status: OutboundStatus;
  doneAt?: Date | null;
  storageUnits?: StorageUnit[];
}
