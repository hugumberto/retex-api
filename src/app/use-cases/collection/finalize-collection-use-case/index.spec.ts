import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { Package } from '../../../../domain/package/package.entity';
import { IPackageRepository } from '../../../../domain/package/package.repository';
import { QrCode } from '../../../../domain/qr-code/qr-code.entity';
import { IQrCodeRepository } from '../../../../domain/qr-code/qr-code.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { FinalizeCollectionUseCase } from '.';

describe('FinalizeCollectionUseCase', () => {
  const packageRepo = mock<IPackageRepository>();
  const qrCodeRepo = mock<IQrCodeRepository>();
  let useCase: FinalizeCollectionUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        FinalizeCollectionUseCase,
        { provide: DOMAIN_TOKENS.PACKAGE_REPOSITORY, useValue: packageRepo },
        { provide: DOMAIN_TOKENS.QR_CODE_REPOSITORY, useValue: qrCodeRepo },
      ],
    }).compile();
    useCase = module.get(FinalizeCollectionUseCase);
  });

  const waiting = { id: 'p1', status: 'WAITING_FOR_COLLECTION' } as Package;

  it('throws NotFound when the package does not exist', async () => {
    packageRepo.findOne.mockResolvedValue(undefined);
    await expect(useCase.call('p1')).rejects.toThrow(NotFoundException);
  });

  it('throws when the package is not waiting for collection', async () => {
    packageRepo.findOne.mockResolvedValue({ id: 'p1', status: 'CREATED' } as Package);
    await expect(useCase.call('p1')).rejects.toThrow(BadRequestException);
  });

  it('throws when there are no bound volumes', async () => {
    packageRepo.findOne.mockResolvedValue(waiting);
    qrCodeRepo.find.mockResolvedValue([]);
    await expect(useCase.call('p1')).rejects.toThrow(BadRequestException);
  });

  it('sets the package to COLLECTED when volumes are bound', async () => {
    packageRepo.findOne.mockResolvedValue(waiting);
    qrCodeRepo.find.mockResolvedValue([{ id: 'q1' } as QrCode]);
    packageRepo.update.mockResolvedValue([{ id: 'p1' } as Package]);

    await useCase.call('p1');

    expect(packageRepo.update).toHaveBeenCalledWith(
      { id: 'p1' },
      { status: 'COLLECTED' },
    );
  });
});
