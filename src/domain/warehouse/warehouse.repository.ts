import { IRepository } from '../interfaces/repository.interface';
import { StorageZone } from '../storage-unit/storage-unit.entity';
import { WarehouseOutbound } from './warehouse-outbound.entity';

/** Sacos recebidos e ainda por triar (zona A). */
export type SortingStock = { weight: number; bags: number };

/** Lotes ativos de uma zona (B, C ou D). */
export type ZoneStock = {
  zone: StorageZone;
  // Kg pesados nos lotes.
  weight: number;
  // Peças nos lotes sem peso (para estimar).
  piecesWithoutWeight: number;
  pieces: number;
};

/** Uma linha de "Entradas de hoje": um pedido com sacos recebidos no dia. */
export type ReceptionRow = {
  collectionRequestId: string;
  code: string | null;
  city: string | null;
  routeCode: string | null;
  // Hora do último saco lido.
  receivedAt: Date;
  bagsLinked: number;
  bagsReceived: number;
  weight: number;
  status: string;
};

export interface IWarehouseOutboundRepository extends IRepository<WarehouseOutbound> {
  findWithUnits(id: string): Promise<WarehouseOutbound | null>;
  findScheduled(): Promise<WarehouseOutbound[]>;
  setUnits(outboundId: string, storageUnitIds: string[]): Promise<void>;

  sortingStock(): Promise<SortingStock>;
  zoneStock(): Promise<ZoneStock[]>;
  /** Kg médio por peça, das triagens (peso dos sacos ÷ peças). */
  averageKgPerPiece(): Promise<number | null>;
  receptionsOn(date: string): Promise<ReceptionRow[]>;
}
