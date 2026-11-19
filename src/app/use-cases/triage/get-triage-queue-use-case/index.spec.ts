import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { IItemRepository } from '../../../../domain/item/item.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { GetTriageQueueUseCase, startOfTodayInLisbon } from '.';

describe('GetTriageQueueUseCase', () => {
  const items = mock<IItemRepository>();
  let useCase: GetTriageQueueUseCase;

  beforeEach(async () => {
    jest.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [GetTriageQueueUseCase, { provide: DOMAIN_TOKENS.ITEM_REPOSITORY, useValue: items }],
    }).compile();
    useCase = module.get(GetTriageQueueUseCase);
    items.triageQueue.mockResolvedValue([]);
    items.operatorStats.mockResolvedValue({ pieces: 12, requests: 2 });
  });

  it('completa as categorias rápidas com as de omissão, sem repetir', async () => {
    items.topCategories.mockResolvedValue(['SKIRT', 'BRA']);

    const result = await useCase.call({ operatorId: 'op1' });

    expect(result.quickCategories).toEqual(['SKIRT', 'BRA', 'TROUSERS', 'DRESS', 'COAT', 'SWEATER', 'TOP']);
    expect(result.today).toEqual({ pieces: 12, requests: 2 });
    expect(items.operatorStats).toHaveBeenCalledWith('op1', expect.any(Date));
  });

  it('meia-noite em Lisboa: inverno UTC+0, verão UTC+1', () => {
    expect(startOfTodayInLisbon(new Date('2026-11-19T15:00:00Z')).toISOString()).toBe('2026-11-19T00:00:00.000Z');
    expect(startOfTodayInLisbon(new Date('2026-07-10T15:00:00Z')).toISOString()).toBe('2026-07-09T23:00:00.000Z');
  });
});
