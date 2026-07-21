import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { Item } from '../../../../domain/item/item.entity';
import { IItemRepository } from '../../../../domain/item/item.repository';
import { PackageStatus } from '../../../../domain/package/package.entity';
import { IPackageRepository } from '../../../../domain/package/package.repository';
import { IQrCodeRepository } from '../../../../domain/qr-code/qr-code.repository';
import { StorageUnit } from '../../../../domain/storage-unit/storage-unit.entity';
import { IStorageUnitRepository } from '../../../../domain/storage-unit/storage-unit.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IEmailService } from '../../../services/interfaces/email.interface';
import { SERVICE_TOKENS } from '../../../services/tokens';
import { BindItemsStorageUnitsUseCase } from '.';

describe('BindItemsStorageUnitsUseCase', () => {
  let useCase: BindItemsStorageUnitsUseCase;
  const itemRepositoryMock = mock<IItemRepository>();
  const storageUnitRepositoryMock = mock<IStorageUnitRepository>();
  const packageRepositoryMock = mock<IPackageRepository>();
  const qrCodeRepositoryMock = mock<IQrCodeRepository>();
  const emailServiceMock = mock<IEmailService>();

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        BindItemsStorageUnitsUseCase,
        { provide: DOMAIN_TOKENS.ITEM_REPOSITORY, useValue: itemRepositoryMock },
        { provide: DOMAIN_TOKENS.STORAGE_UNIT_REPOSITORY, useValue: storageUnitRepositoryMock },
        { provide: DOMAIN_TOKENS.PACKAGE_REPOSITORY, useValue: packageRepositoryMock },
        { provide: DOMAIN_TOKENS.QR_CODE_REPOSITORY, useValue: qrCodeRepositoryMock },
        { provide: SERVICE_TOKENS.EMAIL_SERVICE, useValue: emailServiceMock },
      ],
    }).compile();
    useCase = module.get(BindItemsStorageUnitsUseCase);
    qrCodeRepositoryMock.find.mockResolvedValue([]);
    itemRepositoryMock.findByPackageId.mockResolvedValue([]);
  });

  const item = (over: Partial<Item> = {}) =>
    ({
      id: 'i1',
      package: { id: 'p1' },
      brand: { id: 'b1', name: 'Nike' },
      quality: 'GOOD',
      storageUnit: null,
      ...over,
    } as unknown as Item);

  const su = (over: Partial<StorageUnit> = {}) =>
    ({ id: 's1', brand: { id: 'b1' }, quality: 'GOOD', weight: 1, ...over } as unknown as StorageUnit);

  it('rejects when some items are missing', async () => {
    itemRepositoryMock.findByIds.mockResolvedValue([item()]);
    storageUnitRepositoryMock.findByIds.mockResolvedValue([su()]);

    await expect(
      useCase.call({ items: ['i1', 'i2'], storageUnits: ['s1'] }),
    ).rejects.toThrow(BadRequestException);
  });

  it('skips already-bound items (idempotent) and still finalizes', async () => {
    itemRepositoryMock.findByIds.mockResolvedValue([
      item({ storageUnit: { id: 's9' } as StorageUnit }),
    ]);
    itemRepositoryMock.findByPackageId.mockResolvedValue([
      item({ storageUnit: { id: 's9' } as StorageUnit }),
    ]);
    storageUnitRepositoryMock.findByIds.mockResolvedValue([su()]);
    packageRepositoryMock.findOneWithAllRelations.mockResolvedValue({
      id: 'p1',
      user: { email: 'c@x.com', firstName: 'A', lastName: 'B' },
    } as any);

    const result = await useCase.call({ items: ['i1'], storageUnits: ['s1'] });

    expect(itemRepositoryMock.update).not.toHaveBeenCalled();
    expect(packageRepositoryMock.update).toHaveBeenCalledWith(
      { id: 'p1' },
      { status: PackageStatus.STOCKED },
    );
    expect(result.success).toEqual([]);
  });

  it('persists bindings without STOCKED/survey when finalize=false', async () => {
    itemRepositoryMock.findByIds.mockResolvedValue([item()]);
    itemRepositoryMock.findByPackageId.mockResolvedValue([item()]);
    storageUnitRepositoryMock.findByIds.mockResolvedValue([su()]);

    const result = await useCase.call({
      items: ['i1'],
      storageUnits: ['s1'],
      finalize: false,
    });

    expect(itemRepositoryMock.update).toHaveBeenCalledWith(
      { id: 'i1' },
      { storageUnit: expect.objectContaining({ id: 's1' }) },
    );
    expect(packageRepositoryMock.update).not.toHaveBeenCalled();
    expect(result.packageStatus).toBe(PackageStatus.SCREENING);

    await new Promise((resolve) => setImmediate(resolve));
    expect(emailServiceMock.send).not.toHaveBeenCalled();
  });

  it('binds compatible item/unit and moves package to STOCKED', async () => {
    itemRepositoryMock.findByIds.mockResolvedValue([item()]);
    storageUnitRepositoryMock.findByIds.mockResolvedValue([su()]);

    const result = await useCase.call({ items: ['i1'], storageUnits: ['s1'] });

    expect(itemRepositoryMock.update).toHaveBeenCalledWith(
      { id: 'i1' },
      { storageUnit: expect.objectContaining({ id: 's1' }) },
    );
    expect(packageRepositoryMock.update).toHaveBeenCalledWith(
      { id: 'p1' },
      { status: PackageStatus.STOCKED },
    );
    expect(result).toEqual({
      success: ['i1'],
      packageId: 'p1',
      packageStatus: PackageStatus.STOCKED,
    });

    // O survey deixou de ser enviado na triagem — passou para a finalização da rota.
    await new Promise((resolve) => setImmediate(resolve));
    expect(emailServiceMock.send).not.toHaveBeenCalled();
  });
});
