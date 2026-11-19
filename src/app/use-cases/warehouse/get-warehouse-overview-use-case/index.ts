import { Inject, Injectable } from '@nestjs/common';
import { ISystemParameterRepository } from '../../../../domain/system-parameter/system-parameter.repository';
import { StorageZone } from '../../../../domain/storage-unit/storage-unit.entity';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { WarehouseOutbound } from '../../../../domain/warehouse/warehouse-outbound.entity';
import {
  IWarehouseOutboundRepository,
  ReceptionRow,
} from '../../../../domain/warehouse/warehouse.repository';
import { IUseCase } from '../../interfaces/use-case.interface';

export type WarehouseZoneKey = 'SORTING' | StorageZone;

export type WarehouseZoneSummary = {
  zone: WarehouseZoneKey;
  capacityKg: number;
  weightKg: number;
  // Parte do peso estimada a partir das peças (lotes sem peso registado).
  estimated: boolean;
  bags?: number;
  pieces?: number;
};

export type WarehouseOverview = {
  date: string;
  zones: WarehouseZoneSummary[];
  totalWeightKg: number;
  totalCapacityKg: number;
  receptions: ReceptionRow[];
  outbounds: WarehouseOutbound[];
};

const ZONES: StorageZone[] = [StorageZone.REUSE, StorageZone.UPCYCLING, StorageZone.RECYCLING];

/** Tudo o que o ecrã "Receção e armazém" mostra, num pedido. */
@Injectable()
export class GetWarehouseOverviewUseCase implements IUseCase<{ date: string }, WarehouseOverview> {
  constructor(
    @Inject(DOMAIN_TOKENS.WAREHOUSE_OUTBOUND_REPOSITORY)
    private readonly warehouseRepository: IWarehouseOutboundRepository,
    @Inject(DOMAIN_TOKENS.SYSTEM_PARAMETER_REPOSITORY)
    private readonly systemParameterRepository: ISystemParameterRepository,
  ) {}

  async call({ date }: { date: string }): Promise<WarehouseOverview> {
    const [params, sorting, stock, kgPerPiece, receptions, outbounds] = await Promise.all([
      this.systemParameterRepository.getSingleton(),
      this.warehouseRepository.sortingStock(),
      this.warehouseRepository.zoneStock(),
      this.warehouseRepository.averageKgPerPiece(),
      this.warehouseRepository.receptionsOn(date),
      this.warehouseRepository.findScheduled(),
    ]);

    const capacity: Record<WarehouseZoneKey, number> = {
      SORTING: params?.zoneSortingCapacityKg ?? 3000,
      REUSE: params?.zoneReuseCapacityKg ?? 1500,
      UPCYCLING: params?.zoneUpcyclingCapacityKg ?? 500,
      RECYCLING: params?.zoneRecyclingCapacityKg ?? 2000,
    };

    const zones: WarehouseZoneSummary[] = [
      {
        zone: 'SORTING',
        capacityKg: capacity.SORTING,
        weightKg: round(sorting.weight),
        estimated: false,
        bags: sorting.bags,
      },
      ...ZONES.map((zone) => {
        const s = stock.find((row) => row.zone === zone);
        // Lotes sem peso registado: peças × kg médio por peça das triagens.
        const estimate = s && kgPerPiece ? s.piecesWithoutWeight * kgPerPiece : 0;
        return {
          zone,
          capacityKg: capacity[zone],
          weightKg: round((s?.weight ?? 0) + estimate),
          estimated: estimate > 0,
          pieces: s?.pieces ?? 0,
        };
      }),
    ];

    return {
      date,
      zones,
      totalWeightKg: round(zones.reduce((sum, z) => sum + z.weightKg, 0)),
      totalCapacityKg: zones.reduce((sum, z) => sum + z.capacityKg, 0),
      receptions,
      outbounds,
    };
  }
}

const round = (value: number) => Math.round(value * 10) / 10;
