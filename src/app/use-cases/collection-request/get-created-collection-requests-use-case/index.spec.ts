import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { GetCreatedCollectionRequestsUseCase } from '.';

describe('GetCreatedCollectionRequestsUseCase', () => {
  const repo = mock<ICollectionRequestRepository>();
  let useCase: GetCreatedCollectionRequestsUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        GetCreatedCollectionRequestsUseCase,
        { provide: DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY, useValue: repo },
      ],
    }).compile();
    useCase = module.get(GetCreatedCollectionRequestsUseCase);
  });

  it('lists only CREATED and unrouted collectionRequests with default pagination', async () => {
    const result = { data: [], meta: { total: 0, page: 1, limit: 1000, totalPages: 0 } };
    repo.findByFiltersWithPagination.mockResolvedValue(result);

    await useCase.call({} as any);

    expect(repo.findByFiltersWithPagination).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'CREATED', unrouted: true }),
      expect.objectContaining({ page: 1, limit: 1000 }),
    );
  });
});
