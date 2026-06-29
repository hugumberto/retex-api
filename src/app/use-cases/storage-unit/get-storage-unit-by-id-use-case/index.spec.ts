import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { StorageUnit } from '../../../../domain/storage-unit/storage-unit.entity';
import { IStorageUnitRepository } from '../../../../domain/storage-unit/storage-unit.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { GetStorageUnitByIdUseCase } from '.';

describe('GetStorageUnitByIdUseCase', () => {
  const repo = mock<IStorageUnitRepository>();
  let useCase: GetStorageUnitByIdUseCase;

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

  it('returns the storage unit with brand', async () => {
    const unit = { id: 's1' } as StorageUnit;
    repo.findOneWithBrand.mockResolvedValue(unit);
    expect(await useCase.call('s1')).toBe(unit);
    expect(repo.findOneWithBrand).toHaveBeenCalledWith({ id: 's1' });
  });
});
