import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { Package } from '../../../../domain/package/package.entity';
import { IPackageRepository } from '../../../../domain/package/package.repository';
import { QrCode } from '../../../../domain/qr-code/qr-code.entity';
import { IQrCodeRepository } from '../../../../domain/qr-code/qr-code.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { ProcessTriageQrUseCase } from '.';

describe('ProcessTriageQrUseCase', () => {
  const qrCodeRepo = mock<IQrCodeRepository>();
  const packageRepo = mock<IPackageRepository>();
  let useCase: ProcessTriageQrUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ProcessTriageQrUseCase,
        { provide: DOMAIN_TOKENS.QR_CODE_REPOSITORY, useValue: qrCodeRepo },
        { provide: DOMAIN_TOKENS.PACKAGE_REPOSITORY, useValue: packageRepo },
      ],
    }).compile();
    useCase = module.get(ProcessTriageQrUseCase);
  });

  it('throws when the QR is not linked to a package', async () => {
    qrCodeRepo.findOne.mockResolvedValue({ id: 'q1', packageId: null } as QrCode);
    await expect(useCase.call({ qrCodeId: 'q1', weight: 2 })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws when the package is not in collection/screening', async () => {
    qrCodeRepo.findOne.mockResolvedValue({ id: 'q1', packageId: 'p1' } as QrCode);
    packageRepo.findOne.mockResolvedValue({ id: 'p1', status: 'STOCKED' } as Package);
    await expect(useCase.call({ qrCodeId: 'q1', weight: 2 })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('sets weight+processedAt, recomputes the package weight and SCREENING', async () => {
    qrCodeRepo.findOne.mockResolvedValue({ id: 'q1', packageId: 'p1' } as QrCode);
    packageRepo.findOne.mockResolvedValue({ id: 'p1', status: 'COLLECTED' } as Package);
    qrCodeRepo.update.mockResolvedValue([{ id: 'q1', weight: 4 } as QrCode]);
    qrCodeRepo.find.mockResolvedValue([
      { weight: '4.00' } as unknown as QrCode,
      { weight: '3.00' } as unknown as QrCode,
    ]);

    await useCase.call({ qrCodeId: 'q1', weight: 4 });

    expect(qrCodeRepo.update).toHaveBeenCalledWith(
      { id: 'q1' },
      expect.objectContaining({ weight: 4, processedAt: expect.any(Date) }),
    );
    expect(packageRepo.update).toHaveBeenCalledWith(
      { id: 'p1' },
      { weight: 7, status: 'SCREENING' },
    );
  });

  it('throws NotFound when the QR does not exist', async () => {
    qrCodeRepo.findOne.mockResolvedValue(undefined);
    await expect(useCase.call({ qrCodeId: 'x', weight: 1 })).rejects.toThrow(
      NotFoundException,
    );
  });
});
