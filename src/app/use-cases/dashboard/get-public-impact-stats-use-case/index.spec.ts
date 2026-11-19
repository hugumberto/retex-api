import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { ENVIRONMENTAL_FACTORS } from '../../../../domain/dashboard/environmental-factors';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { IItemRepository } from '../../../../domain/item/item.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { GetPublicImpactStatsUseCase } from '.';

describe('GetPublicImpactStatsUseCase', () => {
  const collectionRequestRepo = mock<ICollectionRequestRepository>();
  const itemRepo = mock<IItemRepository>();
  let useCase: GetPublicImpactStatsUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        GetPublicImpactStatsUseCase,
        { provide: DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY, useValue: collectionRequestRepo },
        { provide: DOMAIN_TOKENS.ITEM_REPOSITORY, useValue: itemRepo },
      ],
    }).compile();
    useCase = module.get(GetPublicImpactStatsUseCase);
  });

  const totals = (totalWeight: number) => ({
    totalCollectionRequests: 1,
    totalWeight,
    totalEstimatedBags: 0,
    totalCollectedBags: 0,
  });

  it('agrega peso, concelhos, % reutilizada (sem acessórios) e CO2', async () => {
    collectionRequestRepo.getTotals.mockResolvedValue(totals(1234.4));
    collectionRequestRepo.countCitiesServed.mockResolvedValue(3);
    itemRepo.aggregateBy.mockResolvedValue([
      { key: 'REUSE', count: 2, quantity: 6 },
      { key: 'UPCYCLING', count: 1, quantity: 1 },
      { key: 'NON_REUSABLE', count: 1, quantity: 3 },
      { key: 'ACCESSORY', count: 1, quantity: 90 },
    ]);

    const result = await useCase.call();

    expect(itemRepo.aggregateBy).toHaveBeenCalledWith('destination');
    expect(result).toMatchObject({
      collectedKg: 1234,
      citiesServed: 3,
      reusedPercent: 70,
      co2AvoidedKg: Math.round(1234.4 * ENVIRONMENTAL_FACTORS.CO2_KG_PER_KG),
    });
    expect(Number.isNaN(Date.parse(result.updatedAt))).toBe(false);
  });

  it('devolve reusedPercent null sem peças triadas', async () => {
    collectionRequestRepo.getTotals.mockResolvedValue(totals(0));
    collectionRequestRepo.countCitiesServed.mockResolvedValue(0);
    itemRepo.aggregateBy.mockResolvedValue([]);

    expect((await useCase.call()).reusedPercent).toBeNull();
  });
});
