import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { CollectionRequest } from '../../../../domain/collection-request/collection-request.entity';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { CompanyContextService } from '../../../services/company-context/company-context.service';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { GetCollectionRequestByIdUseCase } from '.';

describe('GetCollectionRequestByIdUseCase', () => {
  let getCollectionRequestByIdUseCase: GetCollectionRequestByIdUseCase;
  const collectionRequestRepositoryMock = mock<ICollectionRequestRepository>();

  // Por omissão o utilizador não é membro de empresa — preserva o comportamento
  // dos particulares, que é o que estes testes cobrem.
  const companyContextMock = { resolve: jest.fn().mockResolvedValue(null) };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        GetCollectionRequestByIdUseCase,
        { provide: CompanyContextService, useValue: companyContextMock },
        {
          provide: DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY,
          useValue: collectionRequestRepositoryMock,
        },
      ],
    }).compile();

    getCollectionRequestByIdUseCase = module.get(GetCollectionRequestByIdUseCase);
  });

  const pkgOwnedBy = (ownerId: string) =>
    ({ id: 'pkg-id', user: { id: ownerId } } as unknown as CollectionRequest);

  describe('call', () => {
    it('returns the package for a privileged requester (ADMIN/OPS)', async () => {
      const pkg = pkgOwnedBy('someone-else');
      collectionRequestRepositoryMock.findOneWithAllRelations.mockResolvedValue(pkg);

      const response = await getCollectionRequestByIdUseCase.call({
        id: 'pkg-id',
        requesterId: 'admin-id',
        isPrivileged: true,
      });

      expect(response).toEqual(pkg);
    });

    it('returns the package when the USER owns it', async () => {
      const pkg = pkgOwnedBy('me-id');
      collectionRequestRepositoryMock.findOneWithAllRelations.mockResolvedValue(pkg);

      const response = await getCollectionRequestByIdUseCase.call({
        id: 'pkg-id',
        requesterId: 'me-id',
        isPrivileged: false,
      });

      expect(response).toEqual(pkg);
    });

    it('hides another user\'s package from a non-privileged requester (404)', async () => {
      collectionRequestRepositoryMock.findOneWithAllRelations.mockResolvedValue(
        pkgOwnedBy('someone-else'),
      );

      await expect(
        getCollectionRequestByIdUseCase.call({
          id: 'pkg-id',
          requesterId: 'me-id',
          isPrivileged: false,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws not found when the package does not exist', async () => {
      collectionRequestRepositoryMock.findOneWithAllRelations.mockResolvedValue(undefined);

      await expect(
        getCollectionRequestByIdUseCase.call({
          id: 'missing-id',
          requesterId: 'admin-id',
          isPrivileged: true,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
