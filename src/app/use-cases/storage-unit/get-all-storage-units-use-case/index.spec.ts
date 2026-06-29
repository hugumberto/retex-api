import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { StorageUnit } from '../../../../domain/storage-unit/storage-unit.entity';
import { IStorageUnitRepository } from '../../../../domain/storage-unit/storage-unit.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { GetAllStorageUnitsUseCase } from '.';

describe('GetAllStorageUnitsUseCase', () => {
  const repo = mock<IStorageUnitRepository>();
  let useCase: GetAllStorageUnitsUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        GetAllStorageUnitsUseCase,
        { provide: DOMAIN_TOKENS.STORAGE_UNIT_REPOSITORY, useValue: repo },
      ],
    }).compile();
    useCase = module.get(GetAllStorageUnitsUseCase);
  });

  it('returns all storage units with brand', async () => {
    const units = [{ id: 's1' } as StorageUnit];
    repo.findAllWithBrand.mockResolvedValue(units);
    expect(await useCase.call()).toBe(units);
  });
});
