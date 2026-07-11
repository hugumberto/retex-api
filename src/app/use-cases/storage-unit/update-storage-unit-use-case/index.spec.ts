import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { StorageUnit } from '../../../../domain/storage-unit/storage-unit.entity';
import { IStorageUnitRepository } from '../../../../domain/storage-unit/storage-unit.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { UpdateStorageUnitUseCase } from '.';

describe('UpdateStorageUnitUseCase', () => {
  const repo = mock<IStorageUnitRepository>();
  let useCase: UpdateStorageUnitUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        UpdateStorageUnitUseCase,
        { provide: DOMAIN_TOKENS.STORAGE_UNIT_REPOSITORY, useValue: repo },
      ],
    }).compile();
    useCase = module.get(UpdateStorageUnitUseCase);
  });

  it('throws when the storage unit does not exist', async () => {
    repo.findOne.mockResolvedValue(undefined);
    await expect(
      useCase.call({ id: 's1', data: {} } as any),
    ).rejects.toThrow('StorageUnit não encontrado');
  });

  it('updates an existing storage unit', async () => {
    repo.findOne.mockResolvedValue({ id: 's1' } as StorageUnit);
    repo.update.mockResolvedValue([{ id: 's1' } as StorageUnit]);
    await useCase.call({ id: 's1', data: { weight: 3 } } as any);
    expect(repo.update).toHaveBeenCalled();
  });
});
