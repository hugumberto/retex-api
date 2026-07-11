import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { IBrandRepository } from '../../../../domain/brand/brand.repository';
import { Item } from '../../../../domain/item/item.entity';
import { IItemRepository } from '../../../../domain/item/item.repository';
import { PackageStatus } from '../../../../domain/package/package.entity';
import { IPackageRepository } from '../../../../domain/package/package.repository';
import { IQrCodeRepository } from '../../../../domain/qr-code/qr-code.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { CreateItemUseCase } from '.';

describe('CreateItemUseCase', () => {
  let useCase: CreateItemUseCase;
  const itemRepositoryMock = mock<IItemRepository>();
  const packageRepositoryMock = mock<IPackageRepository>();
  const brandRepositoryMock = mock<IBrandRepository>();
  const qrCodeRepositoryMock = mock<IQrCodeRepository>();

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        CreateItemUseCase,
        { provide: DOMAIN_TOKENS.ITEM_REPOSITORY, useValue: itemRepositoryMock },
        { provide: DOMAIN_TOKENS.PACKAGE_REPOSITORY, useValue: packageRepositoryMock },
        { provide: DOMAIN_TOKENS.BRAND_REPOSITORY, useValue: brandRepositoryMock },
        { provide: DOMAIN_TOKENS.QR_CODE_REPOSITORY, useValue: qrCodeRepositoryMock },
      ],
    }).compile();
    useCase = module.get(CreateItemUseCase);
  });

  const param = {
    packageId: 'p1', brandId: 'b1', quality: 'GOOD', type: 'UPPER_PART', season: 'SUMMER', quantity: 3,
  } as any;

  it('throws when the package does not exist', async () => {
    packageRepositoryMock.findOne.mockResolvedValue(undefined);
    await expect(useCase.call(param)).rejects.toThrow(BadRequestException);
  });

  it('throws when the brand does not exist', async () => {
    packageRepositoryMock.findOne.mockResolvedValue({ id: 'p1' } as any);
    brandRepositoryMock.findOne.mockResolvedValue(undefined);
    await expect(useCase.call(param)).rejects.toThrow(BadRequestException);
  });

  it('moves the package to SCREENING on the first item', async () => {
    packageRepositoryMock.findOne.mockResolvedValue({ id: 'p1' } as any);
    brandRepositoryMock.findOne.mockResolvedValue({ id: 'b1' } as any);
    itemRepositoryMock.findByPackageId.mockResolvedValue([]);
    itemRepositoryMock.create.mockResolvedValue({ id: 'i1' } as Item);

    await useCase.call(param);

    expect(packageRepositoryMock.update).toHaveBeenCalledWith(
      { id: 'p1' },
      { status: PackageStatus.SCREENING },
    );
  });

  it('does not change package status for subsequent items', async () => {
    packageRepositoryMock.findOne.mockResolvedValue({ id: 'p1' } as any);
    brandRepositoryMock.findOne.mockResolvedValue({ id: 'b1' } as any);
    itemRepositoryMock.findByPackageId.mockResolvedValue([{ id: 'existing' } as Item]);
    itemRepositoryMock.create.mockResolvedValue({ id: 'i2' } as Item);

    await useCase.call(param);

    expect(packageRepositoryMock.update).not.toHaveBeenCalled();
  });
});
