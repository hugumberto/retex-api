import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { CollectionRequest } from '../../../../domain/collection-request/collection-request.entity';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { QrCode } from '../../../../domain/qr-code/qr-code.entity';
import { IQrCodeRepository } from '../../../../domain/qr-code/qr-code.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { BindQrCodeUseCase } from '.';

describe('BindQrCodeUseCase', () => {
  const collectionRequestRepo = mock<ICollectionRequestRepository>();
  const qrCodeRepo = mock<IQrCodeRepository>();
  let useCase: BindQrCodeUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        BindQrCodeUseCase,
        { provide: DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY, useValue: collectionRequestRepo },
        { provide: DOMAIN_TOKENS.QR_CODE_REPOSITORY, useValue: qrCodeRepo },
      ],
    }).compile();
    useCase = module.get(BindQrCodeUseCase);
  });

  const waiting = { id: 'p1', status: 'WAITING_FOR_COLLECTION' } as CollectionRequest;

  it('throws when the package is not waiting for collection', async () => {
    collectionRequestRepo.findOneWithAllRelations.mockResolvedValue({ id: 'p1', status: 'CREATED' } as CollectionRequest);
    await expect(
      useCase.call({ collectionRequestId: 'p1', code: 'x' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws NotFound when the code matches no qr code', async () => {
    collectionRequestRepo.findOneWithAllRelations.mockResolvedValue(waiting);
    qrCodeRepo.findOne.mockResolvedValue(undefined);
    await expect(
      useCase.call({ collectionRequestId: 'p1', code: 'x' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects an already-used qr code', async () => {
    collectionRequestRepo.findOneWithAllRelations.mockResolvedValue(waiting);
    qrCodeRepo.findOne.mockResolvedValue({ id: 'q1', usedAt: new Date() } as QrCode);
    await expect(
      useCase.call({ collectionRequestId: 'p1', code: 'tok' }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects a qr code from a different route', async () => {
    collectionRequestRepo.findOneWithAllRelations.mockResolvedValue({
      id: 'p1',
      status: 'WAITING_FOR_COLLECTION',
      route: { id: 'r1' },
    } as unknown as CollectionRequest);
    qrCodeRepo.findOne.mockResolvedValue({
      id: 'q1',
      usedAt: null,
      routeId: 'r2',
    } as QrCode);
    await expect(
      useCase.call({ collectionRequestId: 'p1', code: 'tok' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('binds by token: sets collectionRequestId + usedAt', async () => {
    collectionRequestRepo.findOneWithAllRelations.mockResolvedValue(waiting);
    qrCodeRepo.findOne.mockResolvedValue({ id: 'q1', usedAt: null } as QrCode);
    qrCodeRepo.update.mockResolvedValue([{ id: 'q1' } as QrCode]);

    await useCase.call({ collectionRequestId: 'p1', code: 'tok' });

    expect(qrCodeRepo.update).toHaveBeenCalledWith(
      { id: 'q1' },
      expect.objectContaining({ collectionRequestId: 'p1', usedAt: expect.any(Date) }),
    );
  });

  it('falls back to friendlyCode when token lookup misses', async () => {
    collectionRequestRepo.findOneWithAllRelations.mockResolvedValue(waiting);
    qrCodeRepo.findOne
      .mockResolvedValueOnce(undefined) // por token
      .mockResolvedValueOnce({ id: 'q2', usedAt: null } as QrCode); // por friendlyCode
    qrCodeRepo.update.mockResolvedValue([{ id: 'q2' } as QrCode]);

    await useCase.call({ collectionRequestId: 'p1', code: '2026-ABC123' });

    expect(qrCodeRepo.findOne).toHaveBeenNthCalledWith(1, { token: '2026-ABC123' });
    expect(qrCodeRepo.findOne).toHaveBeenNthCalledWith(2, { friendlyCode: '2026-ABC123' });
    expect(qrCodeRepo.update).toHaveBeenCalled();
  });
});
