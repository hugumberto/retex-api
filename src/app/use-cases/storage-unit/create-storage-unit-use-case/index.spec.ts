import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { StorageUnit } from '../../../../domain/storage-unit/storage-unit.entity';
import { IStorageUnitRepository } from '../../../../domain/storage-unit/storage-unit.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { CreateStorageUnitUseCase } from '.';

describe('CreateStorageUnitUseCase', () => {
  const repo = mock<IStorageUnitRepository>();
  let useCase: CreateStorageUnitUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        CreateStorageUnitUseCase,
        { provide: DOMAIN_TOKENS.STORAGE_UNIT_REPOSITORY, useValue: repo },
      ],
    }).compile();
    useCase = module.get(CreateStorageUnitUseCase);
  });

  it('creates the storage unit with its sorting attributes', async () => {
    repo.create.mockResolvedValue({ id: 's1' } as StorageUnit);
    await useCase.call({
      quality: 'GOOD',
      sex: 'MALE',
      ageGroup: 'ADULT',
      type: 'UPPER_PART',
      season: 'SUMMER',
    } as any);
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        quality: 'GOOD',
        sex: 'MALE',
        ageGroup: 'ADULT',
        type: 'UPPER_PART',
        season: 'SUMMER',
        weight: 0,
      }),
    );
  });
});
