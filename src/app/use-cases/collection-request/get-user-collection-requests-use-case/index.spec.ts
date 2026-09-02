import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { CollectionRequest } from '../../../../domain/collection-request/collection-request.entity';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { CompanyContextService } from '../../../services/company-context/company-context.service';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { GetUserCollectionRequestsUseCase } from '.';

describe('GetUserCollectionRequestsUseCase', () => {
  const repo = mock<ICollectionRequestRepository>();
  let useCase: GetUserCollectionRequestsUseCase;

  // Por omissão o utilizador não é membro de empresa — preserva o comportamento
  // dos particulares, que é o que estes testes cobrem.
  const companyContextMock = { resolve: jest.fn().mockResolvedValue(null) };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        GetUserCollectionRequestsUseCase,
        { provide: CompanyContextService, useValue: companyContextMock },
        { provide: DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY, useValue: repo },
      ],
    }).compile();
    useCase = module.get(GetUserCollectionRequestsUseCase);
  });

  it('lists collectionRequests for the given user', async () => {
    const pkgs = [{ id: 'p1' } as CollectionRequest];
    repo.findByUser.mockResolvedValue(pkgs);
    expect(await useCase.call({ userId: 'u1' })).toBe(pkgs);
    expect(repo.findByUser).toHaveBeenCalledWith('u1');
  });
});
