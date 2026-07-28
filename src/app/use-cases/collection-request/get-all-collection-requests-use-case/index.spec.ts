import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { CollectionRequest } from '../../../../domain/collection-request/collection-request.entity';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { GetAllCollectionRequestsUseCase } from '.';

describe('GetAllCollectionRequestsUseCase', () => {
  const repo = mock<ICollectionRequestRepository>();
  let useCase: GetAllCollectionRequestsUseCase;

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

  it('returns all collectionRequests', async () => {
    const pkgs = [{ id: 'p1' } as CollectionRequest];
    repo.findAll.mockResolvedValue(pkgs);
    expect(await useCase.call()).toBe(pkgs);
  });
});
