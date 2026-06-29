import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { Item } from '../../../../domain/item/item.entity';
import { IItemRepository } from '../../../../domain/item/item.repository';
import { PackageStatus } from '../../../../domain/package/package.entity';
import { IPackageRepository } from '../../../../domain/package/package.repository';
import { StorageUnit } from '../../../../domain/storage-unit/storage-unit.entity';
import { IStorageUnitRepository } from '../../../../domain/storage-unit/storage-unit.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { BindItemsStorageUnitsUseCase } from '.';

describe('BindItemsStorageUnitsUseCase', () => {
  let useCase: BindItemsStorageUnitsUseCase;
  const itemRepositoryMock = mock<IItemRepository>();
  const storageUnitRepositoryMock = mock<IStorageUnitRepository>();
  const packageRepositoryMock = mock<IPackageRepository>();

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        BindItemsStorageUnitsUseCase,
        { provide: DOMAIN_TOKENS.ITEM_REPOSITORY, useValue: itemRepositoryMock },
        { provide: DOMAIN_TOKENS.STORAGE_UNIT_REPOSITORY, useValue: storageUnitRepositoryMock },
        { provide: DOMAIN_TOKENS.PACKAGE_REPOSITORY, useValue: packageRepositoryMock },
      ],
    }).compile();
    useCase = module.get(BindItemsStorageUnitsUseCase);
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

  it('rejects when an item is already bound', async () => {
    itemRepositoryMock.findByIds.mockResolvedValue([
      item({ storageUnit: { id: 's9' } as StorageUnit }),
    ]);
    storageUnitRepositoryMock.findByIds.mockResolvedValue([su()]);

    await expect(
      useCase.call({ items: ['i1'], storageUnits: ['s1'] }),
    ).rejects.toThrow(BadRequestException);
  });

  it('binds compatible item/unit and moves the package to STOCKED', async () => {
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
  });
});
