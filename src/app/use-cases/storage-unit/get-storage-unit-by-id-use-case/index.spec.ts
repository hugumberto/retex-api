import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { StorageUnit } from '../../../../domain/storage-unit/storage-unit.entity';
import { IStorageUnitRepository } from '../../../../domain/storage-unit/storage-unit.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { GetStorageUnitByIdUseCase } from '.';

describe('GetStorageUnitByIdUseCase', () => {
  const repo = mock<IStorageUnitRepository>();
  let useCase: GetStorageUnitByIdUseCase;
  const UUID = '11111111-1111-1111-1111-111111111111';

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        GetStorageUnitByIdUseCase,
        { provide: DOMAIN_TOKENS.STORAGE_UNIT_REPOSITORY, useValue: repo },
      ],
    }).compile();
    useCase = module.get(GetStorageUnitByIdUseCase);
  });

  it('returns the storage unit by id (UUID)', async () => {
    const unit = { id: UUID } as StorageUnit;
    repo.findOneWithBrand.mockResolvedValue(unit);

    expect(await useCase.call(UUID)).toBe(unit);
    expect(repo.findOneWithBrand).toHaveBeenCalledWith({ id: UUID });
    expect(repo.findOne).not.toHaveBeenCalled();
  });

  it('resolves the storage unit by friendly code when not a UUID', async () => {
    const unit = { id: UUID, friendlyCode: '2026-ABC123' } as StorageUnit;
    repo.findOne.mockResolvedValue(unit);
    repo.findOneWithBrand.mockResolvedValue(unit);

    expect(await useCase.call('2026-ABC123')).toBe(unit);
    expect(repo.findOne).toHaveBeenCalledWith({ friendlyCode: '2026-ABC123' });
    expect(repo.findOneWithBrand).toHaveBeenCalledWith({ id: UUID });
  });

  it('throws when the friendly code does not match any unit', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(useCase.call('2026-NOPE00')).rejects.toThrow(NotFoundException);
  });
});
