import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { IItemRepository } from '../../../../domain/item/item.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { CompanyContextService } from '../../../services/company-context/company-context.service';
import { GetScopedDashboardStatsUseCase } from '.';

describe('GetScopedDashboardStatsUseCase', () => {
  const collectionRequestRepo = mock<ICollectionRequestRepository>();
  const itemRepo = mock<IItemRepository>();
  const companyContextService = mock<CompanyContextService>();
  let useCase: GetScopedDashboardStatsUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        GetScopedDashboardStatsUseCase,
        {
          provide: DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY,
          useValue: collectionRequestRepo,
        },
        { provide: DOMAIN_TOKENS.ITEM_REPOSITORY, useValue: itemRepo },
        { provide: CompanyContextService, useValue: companyContextService },
      ],
    }).compile();
    useCase = module.get(GetScopedDashboardStatsUseCase);

    collectionRequestRepo.getTotals.mockResolvedValue({
      totalCollectionRequests: 2,
      totalWeight: 10,
      totalEstimatedBags: 5,
      totalCollectedBags: 4,
    });
    collectionRequestRepo.countByStatus.mockResolvedValue([]);
    collectionRequestRepo.getWeightTrend.mockResolvedValue([]);
    collectionRequestRepo.aggregateByMember.mockResolvedValue([
      { userId: 'u1', name: 'Rita', count: 2, weightKg: 10 },
    ]);
    collectionRequestRepo.aggregateByAddress.mockResolvedValue([
      { addressId: 'a1', label: 'Rua X 1 — Maia', count: 2, weightKg: 10 },
    ]);
    itemRepo.aggregateBy.mockResolvedValue([]);
    itemRepo.aggregateByBrand.mockResolvedValue([]);
  });

  it('scopes to the company and adds the breakdown for a member', async () => {
    companyContextService.resolve.mockResolvedValue({
      companyId: 'c1',
      company: { name: 'Têxteis Atlântico' },
      profile: {},
      permissions: [],
    } as never);

    const result = await useCase.call({ userId: 'u1' });

    expect(result.scope).toBe('COMPANY');
    expect(result.company).toEqual({ id: 'c1', name: 'Têxteis Atlântico' });
    // Todas as agregações têm de levar o mesmo âmbito; uma que escape mistura
    // números de outras empresas no ecrã do cliente.
    expect(collectionRequestRepo.getTotals).toHaveBeenCalledWith({ companyId: 'c1' });
    expect(collectionRequestRepo.countByStatus).toHaveBeenCalledWith({ companyId: 'c1' });
    expect(collectionRequestRepo.getWeightTrend).toHaveBeenCalledWith(12, { companyId: 'c1' });
    expect(itemRepo.aggregateByBrand).toHaveBeenCalledWith({ companyId: 'c1' });
    expect(result.breakdown?.byMember).toHaveLength(1);
    expect(result.breakdown?.byAddress).toHaveLength(1);
  });

  it('scopes to the user and omits the breakdown for a private customer', async () => {
    companyContextService.resolve.mockResolvedValue(null);

    const result = await useCase.call({ userId: 'u9' });

    expect(result.scope).toBe('USER');
    expect(result.company).toBeUndefined();
    expect(result.breakdown).toBeUndefined();
    expect(collectionRequestRepo.getTotals).toHaveBeenCalledWith({ userId: 'u9' });
    expect(collectionRequestRepo.aggregateByMember).not.toHaveBeenCalled();
  });

  it('derives the environmental impact from the scoped weight', async () => {
    companyContextService.resolve.mockResolvedValue(null);

    const { environment } = await useCase.call({ userId: 'u9' });

    expect(environment.landfillDivertedKg).toBe(10);
    expect(environment.co2AvoidedKg).toBe(10 * environment.factors.co2KgPerKg);
  });
});
