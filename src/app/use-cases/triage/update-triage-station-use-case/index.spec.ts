import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { TriageStation, TriageStationStatus } from '../../../../domain/triage-station/triage-station.entity';
import { ITriageStationRepository } from '../../../../domain/triage-station/triage-station.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { UpdateTriageStationUseCase } from '.';

const NOW = new Date('2026-11-24T10:00:00Z');

const station = (data: Partial<TriageStation>): TriageStation =>
  ({ id: 's1', number: 1, status: TriageStationStatus.FREE, ...data }) as TriageStation;

describe('UpdateTriageStationUseCase', () => {
  const repo = mock<ITriageStationRepository>();
  let useCase: UpdateTriageStationUseCase;

  beforeEach(async () => {
    jest.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [UpdateTriageStationUseCase, { provide: DOMAIN_TOKENS.TRIAGE_STATION_REPOSITORY, useValue: repo }],
    }).compile();
    useCase = module.get(UpdateTriageStationUseCase);
    repo.update.mockImplementation(async (_q, dto) => [dto as TriageStation]);
    repo.create.mockImplementation(async (dto) => dto as TriageStation);
  });

  it('cria o posto na primeira vez e tira o operador dos outros postos', async () => {
    repo.findByNumber.mockResolvedValue(null);

    const result = await useCase.call({ number: 2, operatorId: 'op1', status: TriageStationStatus.FREE }, NOW);

    expect(repo.releaseOperator).toHaveBeenCalledWith('op1', 2);
    expect(result).toMatchObject({ number: 2, operatorId: 'op1', sessionStartedAt: NOW, lastSeenAt: NOW });
  });

  it('mantém o início da sessão do mesmo operador e limpa a atribuição ao abrir o pedido atribuído', async () => {
    const started = new Date('2026-11-24T09:00:00Z');
    repo.findByNumber.mockResolvedValue(
      station({ operatorId: 'op1', sessionStartedAt: started, lastSeenAt: new Date('2026-11-24T09:59:00Z'), assignedRequestId: 'cr1' }),
    );

    const result = await useCase.call(
      { number: 1, operatorId: 'op1', status: TriageStationStatus.SORTING, collectionRequestId: 'cr1' },
      NOW,
    );

    expect(repo.clearAssignment).toHaveBeenCalledWith('cr1', 1);
    expect(result).toMatchObject({ sessionStartedAt: started, collectionRequestId: 'cr1', assignedRequestId: null });
  });

  it('começa nova sessão quando o posto estava sem sinal', async () => {
    repo.findByNumber.mockResolvedValue(
      station({ operatorId: 'op1', sessionStartedAt: new Date('2026-11-24T07:00:00Z'), lastSeenAt: new Date('2026-11-24T08:00:00Z') }),
    );

    const result = await useCase.call({ number: 1, operatorId: 'op1', status: TriageStationStatus.FREE }, NOW);

    expect(result.sessionStartedAt).toBe(NOW);
  });

  it('ao sair, só liberta o posto se ainda for do operador', async () => {
    repo.findByNumber.mockResolvedValue(station({ operatorId: 'op2' }));

    await useCase.call({ number: 1, operatorId: 'op1', status: TriageStationStatus.FREE, release: true }, NOW);
    expect(repo.update).not.toHaveBeenCalled();

    repo.findByNumber.mockResolvedValue(station({ operatorId: 'op1', collectionRequestId: 'cr1' }));
    const result = await useCase.call({ number: 1, operatorId: 'op1', status: TriageStationStatus.FREE, release: true }, NOW);
    expect(result).toMatchObject({ operatorId: null, collectionRequestId: null, status: TriageStationStatus.FREE });
  });
});
