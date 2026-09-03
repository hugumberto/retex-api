import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { ICollectionRequestBagRepository } from '../../../../domain/collection-request-bag/collection-request-bag.repository';
import { IItemRepository } from '../../../../domain/item/item.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { GetDashboardActivityUseCase } from '.';

describe('GetDashboardActivityUseCase', () => {
  const collectionRequestRepo = mock<ICollectionRequestRepository>();
  const bagRepo = mock<ICollectionRequestBagRepository>();
  const itemRepo = mock<IItemRepository>();
  let useCase: GetDashboardActivityUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    collectionRequestRepo.countCreatedInRange.mockResolvedValue(51);
    bagRepo.countRequestsCollectedInRange.mockResolvedValue(14);
    bagRepo.countRequestsTriagedInRange.mockResolvedValue(11);
    itemRepo.sumQuantityInRange.mockResolvedValue(885);

    const module = await Test.createTestingModule({
      providers: [
        GetDashboardActivityUseCase,
        {
          provide: DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY,
          useValue: collectionRequestRepo,
        },
        {
          provide: DOMAIN_TOKENS.COLLECTION_REQUEST_BAG_REPOSITORY,
          useValue: bagRepo,
        },
        { provide: DOMAIN_TOKENS.ITEM_REPOSITORY, useValue: itemRepo },
      ],
    }).compile();
    useCase = module.get(GetDashboardActivityUseCase);
  });

  it('devolve o funil do período e ecoa o filtro', async () => {
    const range = { from: '2026-08-01', to: '2026-08-31' };

    await expect(useCase.call(range)).resolves.toEqual({
      from: '2026-08-01',
      to: '2026-08-31',
      requests: 51,
      collections: 14,
      triages: 11,
      pieces: 885,
    });

    // O mesmo intervalo vai aos quatro repositórios: cada métrica tem a sua
    // própria data (criação, recolha, triagem, lançamento das peças).
    expect(collectionRequestRepo.countCreatedInRange).toHaveBeenCalledWith(range);
    expect(bagRepo.countRequestsCollectedInRange).toHaveBeenCalledWith(range);
    expect(bagRepo.countRequestsTriagedInRange).toHaveBeenCalledWith(range);
    expect(itemRepo.sumQuantityInRange).toHaveBeenCalledWith(range);
  });

  it('sem filtro conta tudo e devolve os extremos a null', async () => {
    const result = await useCase.call(undefined);

    expect(result.from).toBeNull();
    expect(result.to).toBeNull();
    expect(collectionRequestRepo.countCreatedInRange).toHaveBeenCalledWith({
      from: undefined,
      to: undefined,
    });
  });

  it('aceita apenas um dos extremos', async () => {
    await useCase.call({ from: '2026-09-01' });

    expect(bagRepo.countRequestsTriagedInRange).toHaveBeenCalledWith({
      from: '2026-09-01',
      to: undefined,
    });
  });
});
