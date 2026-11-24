import { Inject, Injectable } from '@nestjs/common';
import { Destination } from '../../../../domain/item/item.entity';
import { IItemRepository } from '../../../../domain/item/item.repository';
import { ISystemParameterRepository } from '../../../../domain/system-parameter/system-parameter.repository';
import {
  PendingLot,
  STATION_STALE_MINUTES,
  TriageStationStatus,
} from '../../../../domain/triage-station/triage-station.entity';
import {
  ITriageStationRepository,
  TriageStationRow,
} from '../../../../domain/triage-station/triage-station.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IWarehouseOutboundRepository } from '../../../../domain/warehouse/warehouse.repository';
import { IUseCase } from '../../interfaces/use-case.interface';
import { startOfTodayInLisbon } from '../get-triage-queue-use-case';

export type OverviewStation = {
  number: number;
  status: TriageStationStatus;
  operatorName: string | null;
  request: TriageStationRow['request'];
  assigned: TriageStationRow['assigned'];
  // Peças por hora na última hora (nulo com pouco tempo de posto).
  rhythm: number | null;
};

export type OverviewQueueEntry = {
  id: string;
  code: string | null;
  clientName: string | null;
  bags: number;
  bagsProcessed: number;
  collectedAt: Date | null;
  waitingDays: number | null;
  assignedStation: number | null;
};

export type OverviewAlert =
  | { type: 'UNBOXED_LOT'; station: number; lot: PendingLot }
  | { type: 'WRONG_BAG'; station: number; at: Date; code: string; otherRequestCode: string | null }
  | { type: 'WAITING'; code: string | null; clientName: string | null; waitingDays: number };

export type TriageOverview = {
  generatedAt: Date;
  targetPerHour: number;
  kpis: {
    pieces: number;
    accessories: number;
    activeStations: number;
    weightKg: number;
    kgPerPiece: number | null;
    avgRhythm: number | null;
    bagsToSort: number;
    requestsDone: number;
    lastDoneAt: Date | null;
  };
  stations: OverviewStation[];
  queue: OverviewQueueEntry[];
  destinations: { reuse: number; upcycling: number; nonReusable: number };
  // Dias para triar a zona A ao ritmo dos últimos dias (nulo sem dados).
  daysToClearSorting: number | null;
  alerts: OverviewAlert[];
};

const MIN_STATIONS = 4;
const QUEUE_LIMIT = 50;
const WAITING_ALERT_DAYS = 7;
const RHYTHM_WINDOW_MIN = 60;
const RHYTHM_MIN_ELAPSED_MIN = 5;
const DAY_MS = 86_400_000;

const REUSE: string[] = [
  Destination.REUSE,
  Destination.VINTAGE,
  Destination.RECONDITIONING,
  Destination.STOCK_RESERVE,
];

/** Dias de calendário (Lisboa) entre `from` e `now`. */
export const daysBetweenInLisbon = (from: Date, now: Date): number =>
  Math.round((startOfTodayInLisbon(now).getTime() - startOfTodayInLisbon(from).getTime()) / DAY_MS);

/** Tudo o que o painel "Triagem" mostra, num pedido (o ecrã volta a pedir a cada 10 s). */
@Injectable()
export class GetTriageOverviewUseCase implements IUseCase<void, TriageOverview> {
  constructor(
    @Inject(DOMAIN_TOKENS.TRIAGE_STATION_REPOSITORY)
    private readonly stationRepository: ITriageStationRepository,
    @Inject(DOMAIN_TOKENS.ITEM_REPOSITORY)
    private readonly itemRepository: IItemRepository,
    @Inject(DOMAIN_TOKENS.WAREHOUSE_OUTBOUND_REPOSITORY)
    private readonly warehouseRepository: IWarehouseOutboundRepository,
    @Inject(DOMAIN_TOKENS.SYSTEM_PARAMETER_REPOSITORY)
    private readonly systemParameterRepository: ISystemParameterRepository,
  ) {}

  async call(_?: void, now = new Date()): Promise<TriageOverview> {
    const today = startOfTodayInLisbon(now);
    const rhythmSince = new Date(now.getTime() - RHYTHM_WINDOW_MIN * 60_000);

    const [params, rows, day, sorting, kgPerPiece, dailyPieces, queue, events] = await Promise.all([
      this.systemParameterRepository.getSingleton(),
      this.stationRepository.rows(rhythmSince),
      this.stationRepository.dayStats(today),
      this.warehouseRepository.sortingStock(),
      this.warehouseRepository.averageKgPerPiece(),
      this.stationRepository.averageDailyPieces(today, 7),
      this.itemRepository.triageQueue(QUEUE_LIMIT),
      this.stationRepository.eventsSince(today, 5),
    ]);

    const stations = this.stations(rows, now, rhythmSince);
    const rhythms = stations
      .filter((s) => s.status === TriageStationStatus.SORTING && s.rhythm !== null)
      .map((s) => s.rhythm as number);

    const openIds = new Set(stations.map((s) => s.request?.id).filter(Boolean));
    const waiting = queue
      .filter((q) => !openIds.has(q.id))
      .map((q) => ({
        id: q.id,
        code: q.code,
        clientName: q.clientName,
        bags: q.bags,
        bagsProcessed: q.bagsProcessed,
        collectedAt: q.collectedAt,
        waitingDays: q.collectedAt ? daysBetweenInLisbon(new Date(q.collectedAt), now) : null,
        assignedStation: q.assignedStation ?? null,
      }))
      .sort((a, b) => (a.collectedAt ? new Date(a.collectedAt).getTime() : Infinity) - (b.collectedAt ? new Date(b.collectedAt).getTime() : Infinity));

    const sum = (keys: string[]) =>
      day.destinations.filter((d) => keys.includes(d.destination)).reduce((acc, d) => acc + d.pieces, 0);

    const piecesToSort = kgPerPiece && sorting.weight > 0 ? sorting.weight / kgPerPiece : null;

    const alerts: OverviewAlert[] = [
      ...stations.flatMap((s) => {
        const row = rows.find((r) => r.number === s.number);
        return s.request && row ? row.pendingLots.map((lot) => ({ type: 'UNBOXED_LOT' as const, station: s.number, lot })) : [];
      }),
      ...events.map((e) => ({
        type: 'WRONG_BAG' as const,
        station: e.station,
        at: e.createdAt,
        code: e.code,
        otherRequestCode: e.otherRequestCode ?? null,
      })),
      ...waiting
        .filter((q) => (q.waitingDays ?? 0) >= WAITING_ALERT_DAYS)
        .slice(0, 3)
        .map((q) => ({ type: 'WAITING' as const, code: q.code, clientName: q.clientName, waitingDays: q.waitingDays as number })),
    ];

    return {
      generatedAt: now,
      targetPerHour: params?.triageTargetPerHour ?? 40,
      kpis: {
        pieces: day.pieces,
        accessories: day.accessories,
        activeStations: stations.filter((s) => s.operatorName).length,
        weightKg: Math.round(day.weight * 10) / 10,
        kgPerPiece: day.piecesOfWeighedBags > 0 ? Math.round((day.weight / day.piecesOfWeighedBags) * 100) / 100 : null,
        avgRhythm: rhythms.length ? Math.round(rhythms.reduce((a, b) => a + b, 0) / rhythms.length) : null,
        bagsToSort: sorting.bags,
        requestsDone: day.requestsDone,
        lastDoneAt: day.lastDoneAt,
      },
      stations,
      queue: waiting,
      destinations: {
        reuse: sum(REUSE),
        upcycling: sum([Destination.UPCYCLING]),
        nonReusable: sum([Destination.NON_REUSABLE]),
      },
      daysToClearSorting:
        piecesToSort !== null && dailyPieces ? Math.max(1, Math.round(piecesToSort / dailyPieces)) : null,
      alerts,
    };
  }

  private stations(rows: TriageStationRow[], now: Date, rhythmSince: Date): OverviewStation[] {
    const count = Math.max(MIN_STATIONS, ...rows.map((r) => r.number));
    return Array.from({ length: count }, (_, i) => i + 1).map((number) => {
      const row = rows.find((r) => r.number === number);
      const assigned = row?.assigned ?? null;
      const fresh =
        !!row?.lastSeenAt && now.getTime() - new Date(row.lastSeenAt).getTime() <= STATION_STALE_MINUTES * 60_000;
      if (!row || !fresh || !row.operatorId) {
        return { number, status: TriageStationStatus.FREE, operatorName: null, request: null, assigned, rhythm: null };
      }
      const from = Math.max(rhythmSince.getTime(), row.sessionStartedAt ? new Date(row.sessionStartedAt).getTime() : rhythmSince.getTime());
      const elapsedMin = (now.getTime() - from) / 60_000;
      return {
        number,
        status: row.request ? row.status : TriageStationStatus.FREE,
        operatorName: row.operatorName,
        request: row.request,
        assigned,
        rhythm: elapsedMin >= RHYTHM_MIN_ELAPSED_MIN ? Math.round(row.recentPieces / (elapsedMin / 60)) : null,
      };
    });
  }
}
