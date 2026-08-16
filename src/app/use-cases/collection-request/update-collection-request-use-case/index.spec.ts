import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { CompanyContextService } from '../../../services/company-context/company-context.service';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import {
  CollectionRequest,
  CollectionRequestStatus,
} from '../../../../domain/collection-request/collection-request.entity';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { FinishRouteIfAllCollectedUseCase } from '../../route/finish-route-if-all-collected-use-case';
import { UpdateCollectionRequestUseCase } from '.';

describe('UpdateCollectionRequestUseCase', () => {
  let updateCollectionRequestUseCase: UpdateCollectionRequestUseCase;
  const collectionRequestRepositoryMock = mock<ICollectionRequestRepository>();
  const finishRouteMock = mock<FinishRouteIfAllCollectedUseCase>();

  // Por omissão o utilizador não é membro de empresa — preserva o comportamento
  // dos particulares, que é o que estes testes cobrem.
  const companyContextMock = { resolve: jest.fn().mockResolvedValue(null) };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        UpdateCollectionRequestUseCase,
        { provide: CompanyContextService, useValue: companyContextMock },
        {
          provide: DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY,
          useValue: collectionRequestRepositoryMock,
        },
        {
          provide: FinishRouteIfAllCollectedUseCase,
          useValue: finishRouteMock,
        },
      ],
    }).compile();

    updateCollectionRequestUseCase = module.get(UpdateCollectionRequestUseCase);
    finishRouteMock.call.mockResolvedValue(undefined);
  });

  const pkgOwnedBy = (ownerId: string) =>
    ({ id: 'package-id', user: { id: ownerId } } as unknown as CollectionRequest);

  describe('privileged (ADMIN/OPS)', () => {
    it('updates status and weight on any package', async () => {
      const updated = mock<CollectionRequest>();
      collectionRequestRepositoryMock.findOneWithAllRelations.mockResolvedValue(
        pkgOwnedBy('someone-else'),
      );
      collectionRequestRepositoryMock.update.mockResolvedValue([updated]);

      const response = await updateCollectionRequestUseCase.call({
        id: 'package-id',
        data: { status: CollectionRequestStatus.IN_TRANSIT, weight: 12.5 },
        requesterId: 'ops-id',
        isPrivileged: true,
      });

      expect(collectionRequestRepositoryMock.update).toHaveBeenCalledWith(
        { id: 'package-id' },
        { status: CollectionRequestStatus.IN_TRANSIT, weight: 12.5 },
      );
      expect(response).toEqual(updated);
    });

    it('ignores zero weight', async () => {
      collectionRequestRepositoryMock.findOneWithAllRelations.mockResolvedValue(
        pkgOwnedBy('x'),
      );
      collectionRequestRepositoryMock.update.mockResolvedValue([mock<CollectionRequest>()]);

      await updateCollectionRequestUseCase.call({
        id: 'package-id',
        data: { status: CollectionRequestStatus.COLLECTED, weight: 0 },
        requesterId: 'ops-id',
        isPrivileged: true,
      });

      expect(collectionRequestRepositoryMock.update).toHaveBeenCalledWith(
        { id: 'package-id' },
        { status: CollectionRequestStatus.COLLECTED },
      );
    });
  });

  describe('non-privileged (USER)', () => {
    it('lets the owner cancel and ignores weight', async () => {
      collectionRequestRepositoryMock.findOneWithAllRelations.mockResolvedValue(
        pkgOwnedBy('me-id'),
      );
      collectionRequestRepositoryMock.update.mockResolvedValue([mock<CollectionRequest>()]);

      await updateCollectionRequestUseCase.call({
        id: 'package-id',
        data: { status: CollectionRequestStatus.CANCELLED, weight: 99 },
        requesterId: 'me-id',
        isPrivileged: false,
      });

      expect(collectionRequestRepositoryMock.update).toHaveBeenCalledWith(
        { id: 'package-id' },
        { status: CollectionRequestStatus.CANCELLED },
      );
    });

    it('hides another user\'s package (404)', async () => {
      collectionRequestRepositoryMock.findOneWithAllRelations.mockResolvedValue(
        pkgOwnedBy('someone-else'),
      );

      await expect(
        updateCollectionRequestUseCase.call({
          id: 'package-id',
          data: { status: CollectionRequestStatus.CANCELLED },
          requesterId: 'me-id',
          isPrivileged: false,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('forbids the owner from non-cancel transitions', async () => {
      collectionRequestRepositoryMock.findOneWithAllRelations.mockResolvedValue(
        pkgOwnedBy('me-id'),
      );

      await expect(
        updateCollectionRequestUseCase.call({
          id: 'package-id',
          data: { status: CollectionRequestStatus.STOCKED },
          requesterId: 'me-id',
          isPrivileged: false,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  it('throws not found when the package does not exist', async () => {
    collectionRequestRepositoryMock.findOneWithAllRelations.mockResolvedValue(undefined);

    await expect(
      updateCollectionRequestUseCase.call({
        id: 'missing-id',
        data: { status: CollectionRequestStatus.IN_TRANSIT },
        requesterId: 'ops-id',
        isPrivileged: true,
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
