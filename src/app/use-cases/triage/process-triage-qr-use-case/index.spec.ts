import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { CollectionRequest } from '../../../../domain/collection-request/collection-request.entity';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { CollectionRequestBag } from '../../../../domain/collection-request-bag/collection-request-bag.entity';
import { ICollectionRequestBagRepository } from '../../../../domain/collection-request-bag/collection-request-bag.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { ProcessTriageQrUseCase } from '.';

describe('ProcessTriageQrUseCase', () => {
  const collectionRequestBagRepo = mock<ICollectionRequestBagRepository>();
  const collectionRequestRepo = mock<ICollectionRequestRepository>();
  let useCase: ProcessTriageQrUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ProcessTriageQrUseCase,
        { provide: DOMAIN_TOKENS.COLLECTION_REQUEST_BAG_REPOSITORY, useValue: collectionRequestBagRepo },
        { provide: DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY, useValue: collectionRequestRepo },
      ],
    }).compile();
    useCase = module.get(ProcessTriageQrUseCase);
  });

  it('throws when the QR is not linked to a package', async () => {
    collectionRequestBagRepo.findOne.mockResolvedValue({ id: 'q1', collectionRequestId: null } as CollectionRequestBag);
    await expect(useCase.call({ bagId: 'q1', weight: 2 })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws when the package is not in collection/screening', async () => {
    collectionRequestBagRepo.findOne.mockResolvedValue({ id: 'q1', collectionRequestId: 'p1' } as CollectionRequestBag);
    collectionRequestRepo.findOne.mockResolvedValue({ id: 'p1', status: 'STOCKED' } as CollectionRequest);
    await expect(useCase.call({ bagId: 'q1', weight: 2 })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('sets weight+processedAt, recomputes the package weight and SCREENING', async () => {
    collectionRequestBagRepo.findOne.mockResolvedValue({ id: 'q1', collectionRequestId: 'p1' } as CollectionRequestBag);
    collectionRequestRepo.findOne.mockResolvedValue({ id: 'p1', status: 'COLLECTED' } as CollectionRequest);
    collectionRequestBagRepo.update.mockResolvedValue([{ id: 'q1', weight: 4 } as CollectionRequestBag]);
    collectionRequestBagRepo.find.mockResolvedValue([
      { weight: '4.00' } as unknown as CollectionRequestBag,
      { weight: '3.00' } as unknown as CollectionRequestBag,
    ]);

    await useCase.call({ bagId: 'q1', weight: 4 });

    expect(collectionRequestBagRepo.update).toHaveBeenCalledWith(
      { id: 'q1' },
      expect.objectContaining({ weight: 4, processedAt: expect.any(Date) }),
    );
    expect(collectionRequestRepo.update).toHaveBeenCalledWith(
      { id: 'p1' },
      { weight: 7, status: 'SCREENING' },
    );
  });

  it('saves only the weight when markProcessed is false', async () => {
    collectionRequestBagRepo.findOne.mockResolvedValue({ id: 'q1', collectionRequestId: 'p1' } as CollectionRequestBag);
    collectionRequestRepo.findOne.mockResolvedValue({ id: 'p1', status: 'COLLECTED' } as CollectionRequest);
    collectionRequestBagRepo.update.mockResolvedValue([{ id: 'q1', weight: 4 } as CollectionRequestBag]);
    collectionRequestBagRepo.find.mockResolvedValue([
      { weight: '4.00' } as unknown as CollectionRequestBag,
    ]);

    await useCase.call({ bagId: 'q1', weight: 4, markProcessed: false });

    // Sem processedAt no update — o volume fica por terminar.
    expect(collectionRequestBagRepo.update).toHaveBeenCalledWith(
      { id: 'q1' },
      { weight: 4 },
    );
    expect(collectionRequestRepo.update).toHaveBeenCalledWith(
      { id: 'p1' },
      { weight: 4, status: 'SCREENING' },
    );
  });

  it('throws NotFound when the QR does not exist', async () => {
    collectionRequestBagRepo.findOne.mockResolvedValue(undefined);
    await expect(useCase.call({ bagId: 'x', weight: 1 })).rejects.toThrow(
      NotFoundException,
    );
  });
});
