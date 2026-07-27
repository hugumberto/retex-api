import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { CollectionRequest } from '../../../../domain/collection-request/collection-request.entity';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { QrCode } from '../../../../domain/qr-code/qr-code.entity';
import { IQrCodeRepository } from '../../../../domain/qr-code/qr-code.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { FinishRouteIfAllCollectedUseCase } from '../../route/finish-route-if-all-collected-use-case';
import { FinalizeCollectionUseCase } from '.';

describe('FinalizeCollectionUseCase', () => {
  const collectionRequestRepo = mock<ICollectionRequestRepository>();
  const qrCodeRepo = mock<IQrCodeRepository>();
  const finishRoute = mock<FinishRouteIfAllCollectedUseCase>();
  let useCase: FinalizeCollectionUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        FinalizeCollectionUseCase,
        { provide: DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY, useValue: collectionRequestRepo },
        { provide: DOMAIN_TOKENS.QR_CODE_REPOSITORY, useValue: qrCodeRepo },
        { provide: FinishRouteIfAllCollectedUseCase, useValue: finishRoute },
      ],
    }).compile();
    useCase = module.get(FinalizeCollectionUseCase);
    finishRoute.call.mockResolvedValue(undefined);
  });

  const waiting = { id: 'p1', status: 'WAITING_FOR_COLLECTION' } as CollectionRequest;

  it('throws NotFound when the package does not exist', async () => {
    collectionRequestRepo.findOne.mockResolvedValue(undefined);
    await expect(useCase.call('p1')).rejects.toThrow(NotFoundException);
  });

  it('throws when the package is not waiting for collection', async () => {
    collectionRequestRepo.findOne.mockResolvedValue({ id: 'p1', status: 'CREATED' } as CollectionRequest);
    await expect(useCase.call('p1')).rejects.toThrow(BadRequestException);
  });

  it('throws when there are no bound volumes', async () => {
    collectionRequestRepo.findOne.mockResolvedValue(waiting);
    qrCodeRepo.find.mockResolvedValue([]);
    await expect(useCase.call('p1')).rejects.toThrow(BadRequestException);
  });

  it('sets the package to COLLECTED when volumes are bound', async () => {
    collectionRequestRepo.findOne.mockResolvedValue(waiting);
    qrCodeRepo.find.mockResolvedValue([{ id: 'q1' } as QrCode]);
    collectionRequestRepo.update.mockResolvedValue([{ id: 'p1' } as CollectionRequest]);

    await useCase.call('p1');

    expect(collectionRequestRepo.update).toHaveBeenCalledWith(
      { id: 'p1' },
      { status: 'COLLECTED' },
    );
  });
});
