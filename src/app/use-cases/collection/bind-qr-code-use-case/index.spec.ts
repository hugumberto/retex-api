import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { Package } from '../../../../domain/package/package.entity';
import { IPackageRepository } from '../../../../domain/package/package.repository';
import { QrCode } from '../../../../domain/qr-code/qr-code.entity';
import { IQrCodeRepository } from '../../../../domain/qr-code/qr-code.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { BindQrCodeUseCase } from '.';

describe('BindQrCodeUseCase', () => {
  const packageRepo = mock<IPackageRepository>();
  const qrCodeRepo = mock<IQrCodeRepository>();
  let useCase: BindQrCodeUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        BindQrCodeUseCase,
        { provide: DOMAIN_TOKENS.PACKAGE_REPOSITORY, useValue: packageRepo },
        { provide: DOMAIN_TOKENS.QR_CODE_REPOSITORY, useValue: qrCodeRepo },
      ],
    }).compile();
    useCase = module.get(BindQrCodeUseCase);
  });

  const waiting = { id: 'p1', status: 'WAITING_FOR_COLLECTION' } as Package;

  it('throws when the package is not waiting for collection', async () => {
    packageRepo.findOne.mockResolvedValue({ id: 'p1', status: 'CREATED' } as Package);
    await expect(
      useCase.call({ packageId: 'p1', code: 'x' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws NotFound when the code matches no qr code', async () => {
    packageRepo.findOne.mockResolvedValue(waiting);
    qrCodeRepo.findOne.mockResolvedValue(undefined);
    await expect(
      useCase.call({ packageId: 'p1', code: 'x' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects an already-used qr code', async () => {
    packageRepo.findOne.mockResolvedValue(waiting);
    qrCodeRepo.findOne.mockResolvedValue({ id: 'q1', usedAt: new Date() } as QrCode);
    await expect(
      useCase.call({ packageId: 'p1', code: 'tok' }),
    ).rejects.toThrow(ConflictException);
  });

  it('binds by token: sets packageId + usedAt', async () => {
    packageRepo.findOne.mockResolvedValue(waiting);
    qrCodeRepo.findOne.mockResolvedValue({ id: 'q1', usedAt: null } as QrCode);
    qrCodeRepo.update.mockResolvedValue([{ id: 'q1' } as QrCode]);

    await useCase.call({ packageId: 'p1', code: 'tok' });

    expect(qrCodeRepo.update).toHaveBeenCalledWith(
      { id: 'q1' },
      expect.objectContaining({ packageId: 'p1', usedAt: expect.any(Date) }),
    );
  });

  it('falls back to friendlyCode when token lookup misses', async () => {
    packageRepo.findOne.mockResolvedValue(waiting);
    qrCodeRepo.findOne
      .mockResolvedValueOnce(undefined) // por token
      .mockResolvedValueOnce({ id: 'q2', usedAt: null } as QrCode); // por friendlyCode
    qrCodeRepo.update.mockResolvedValue([{ id: 'q2' } as QrCode]);

    await useCase.call({ packageId: 'p1', code: '2026-ABC123' });

    expect(qrCodeRepo.findOne).toHaveBeenNthCalledWith(1, { token: '2026-ABC123' });
    expect(qrCodeRepo.findOne).toHaveBeenNthCalledWith(2, { friendlyCode: '2026-ABC123' });
    expect(qrCodeRepo.update).toHaveBeenCalled();
  });
});
