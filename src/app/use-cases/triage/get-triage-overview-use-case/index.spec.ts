import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { IItemRepository } from '../../../../domain/item/item.repository';
import { ISystemParameterRepository } from '../../../../domain/system-parameter/system-parameter.repository';
import { SystemParameter } from '../../../../domain/system-parameter/system-parameter.entity';
import { TriageEventType, TriageStationStatus } from '../../../../domain/triage-station/triage-station.entity';
import { ITriageStationRepository, TriageStationRow } from '../../../../domain/triage-station/triage-station.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IWarehouseOutboundRepository } from '../../../../domain/warehouse/warehouse.repository';
import { GetTriageOverviewUseCase, daysBetweenInLisbon } from '.';

const NOW = new Date('2026-11-24T10:00:00Z');
const minutesAgo = (m: number) => new Date(NOW.getTime() - m * 60_000);

const row = (data: Partial<TriageStationRow>): TriageStationRow => ({
  number: 1,
  status: TriageStationStatus.SORTING,
  lastSeenAt: minutesAgo(1),
  sessionStartedAt: minutesAgo(30),
  operatorId: 'op1',
  operatorName: 'João S.',
  request: { id: 'cr1', code: '2026-AAA', clientName: 'Escola', bags: 4, bagsProcessed: 1, pieces: 50 },
  assigned: null,
  pendingLots: [],
  recentPieces: 20,
  ...data,
});

describe('GetTriageOverviewUseCase', () => {
  const stations = mock<ITriageStationRepository>();
  const items = mock<IItemRepository>();
  const warehouse = mock<IWarehouseOutboundRepository>();
  const params = mock<ISystemParameterRepository>();
  let useCase: GetTriageOverviewUseCase;

  beforeEach(async () => {
    jest.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        GetTriageOverviewUseCase,
        { provide: DOMAIN_TOKENS.TRIAGE_STATION_REPOSITORY, useValue: stations },
        { provide: DOMAIN_TOKENS.ITEM_REPOSITORY, useValue: items },
        { provide: DOMAIN_TOKENS.WAREHOUSE_OUTBOUND_REPOSITORY, useValue: warehouse },
        { provide: DOMAIN_TOKENS.SYSTEM_PARAMETER_REPOSITORY, useValue: params },
      ],
    }).compile();
    useCase = module.get(GetTriageOverviewUseCase);
    params.getSingleton.mockResolvedValue({ triageTargetPerHour: 40 } as SystemParameter);
    stations.dayStats.mockResolvedValue({
      pieces: 100, accessories: 5, weight: 32, piecesOfWeighedBags: 100, requestsDone: 2, lastDoneAt: null,
      destinations: [
        { destination: 'REUSE', pieces: 50 }, { destination: 'VINTAGE', pieces: 10 },
        { destination: 'UPCYCLING', pieces: 15 }, { destination: 'NON_REUSABLE', pieces: 25 },
        { destination: 'ACCESSORY', pieces: 5 },
      ],
    });
    warehouse.sortingStock.mockResolvedValue({ weight: 640, bags: 40 });
    warehouse.averageKgPerPiece.mockResolvedValue(0.32);
    stations.averageDailyPieces.mockResolvedValue(1000);
    stations.eventsSince.mockResolvedValue([]);
    items.triageQueue.mockResolvedValue([]);
  });

  it('mostra pelo menos 4 postos; sem sinal recente o posto fica livre', async () => {
    stations.rows.mockResolvedValue([
      row({}),
      row({ number: 2, operatorId: 'op2', operatorName: 'Ana', lastSeenAt: minutesAgo(20) }),
    ]);

    const result = await useCase.call(undefined, NOW);

    expect(result.stations.map((s) => s.number)).toEqual([1, 2, 3, 4]);
    expect(result.stations[0]).toMatchObject({ status: TriageStationStatus.SORTING, operatorName: 'João S.', rhythm: 40 });
    expect(result.stations[1]).toMatchObject({ status: TriageStationStatus.FREE, operatorName: null, request: null });
    expect(result.kpis).toMatchObject({ activeStations: 1, avgRhythm: 40, kgPerPiece: 0.32, bagsToSort: 40 });
    expect(result.destinations).toEqual({ reuse: 60, upcycling: 15, nonReusable: 25 });
    // 640 kg ÷ 0,32 kg = 2000 peças ÷ 1000 por dia
    expect(result.daysToClearSorting).toBe(2);
  });

  it('fila sem os pedidos abertos, mais antigos primeiro, e alertas', async () => {
    stations.rows.mockResolvedValue([row({ pendingLots: [{ label: 'Infantil · Verão', pieces: 3 }] })]);
    items.triageQueue.mockResolvedValue([
      { id: 'cr1', code: '2026-AAA', status: 'SCREENING', clientName: 'Escola', bags: 4, bagsProcessed: 1, collectedAt: new Date('2026-11-20T09:00:00Z') },
      { id: 'cr2', code: '2026-BBB', status: 'IN_HOUSE', clientName: 'Café', bags: 6, bagsProcessed: 0, collectedAt: new Date('2026-11-23T09:00:00Z'), assignedStation: 3 },
      { id: 'cr3', code: '2026-CCC', status: 'IN_HOUSE', clientName: 'Junta', bags: 2, bagsProcessed: 0, collectedAt: new Date('2026-11-14T09:00:00Z') },
    ]);
    stations.eventsSince.mockResolvedValue([
      { id: 'e1', station: 2, type: TriageEventType.WRONG_BAG, code: 'ZZ41RT', otherRequestCode: '2026-PL83QA', createdAt: minutesAgo(5) } as never,
    ]);

    const result = await useCase.call(undefined, NOW);

    expect(result.queue.map((q) => q.code)).toEqual(['2026-CCC', '2026-BBB']);
    expect(result.queue[0].waitingDays).toBe(10);
    expect(result.queue[1].assignedStation).toBe(3);
    expect(result.alerts.map((a) => a.type)).toEqual(['UNBOXED_LOT', 'WRONG_BAG', 'WAITING']);
  });

  it('dias em Lisboa contam o calendário, não 24 h', () => {
    expect(daysBetweenInLisbon(new Date('2026-11-23T23:30:00Z'), new Date('2026-11-24T00:30:00Z'))).toBe(1);
  });
});
