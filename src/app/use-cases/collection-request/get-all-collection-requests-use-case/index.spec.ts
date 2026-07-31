import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { CollectionRequest, CollectionRequestStatus } from '../../../../domain/collection-request/collection-request.entity';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { PaginatedResult } from '../../../../domain/interfaces/pagination.interface';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { GetAllCollectionRequestsUseCase } from '.';

describe('GetAllCollectionRequestsUseCase', () => {
  const repo = mock<ICollectionRequestRepository>();
  let useCase: GetAllCollectionRequestsUseCase;

  const page = (data: CollectionRequest[]): PaginatedResult<CollectionRequest> => ({
    data,
    meta: { total: data.length, page: 1, limit: 1000, totalPages: 1 },
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        GetAllCollectionRequestsUseCase,
        { provide: DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY, useValue: repo },
      ],
    }).compile();
    useCase = module.get(GetAllCollectionRequestsUseCase);
  });

  it('lists without filters, with the default pagination', async () => {
    const result = page([{ id: 'p1' } as CollectionRequest]);
    repo.findByFiltersWithPagination.mockResolvedValue(result);

    expect(await useCase.call()).toBe(result);
    expect(repo.findByFiltersWithPagination).toHaveBeenCalledWith(
      { status: undefined, unrouted: undefined },
      { page: 1, limit: 1000 },
    );
  });

  // Substitui o antigo GetCreatedCollectionRequestsUseCase, que tinha estes
  // filtros cravados no código.
  it('passes through the status/unrouted filters and the pagination', async () => {
    repo.findByFiltersWithPagination.mockResolvedValue(page([]));

    await useCase.call({
      status: CollectionRequestStatus.CREATED,
      unrouted: true,
      page: 2,
      limit: 50,
    });

    expect(repo.findByFiltersWithPagination).toHaveBeenCalledWith(
      { status: CollectionRequestStatus.CREATED, unrouted: true },
      { page: 2, limit: 50 },
    );
  });
});
