import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { StorageUnit } from '../../../../domain/storage-unit/storage-unit.entity';
import { IStorageUnitRepository } from '../../../../domain/storage-unit/storage-unit.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { DeleteStorageUnitUseCase } from '.';

describe('DeleteStorageUnitUseCase', () => {
  const repo = mock<IStorageUnitRepository>();
  let useCase: DeleteStorageUnitUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        DeleteStorageUnitUseCase,
        { provide: DOMAIN_TOKENS.STORAGE_UNIT_REPOSITORY, useValue: repo },
      ],
    }).compile();
    useCase = module.get(DeleteStorageUnitUseCase);
  });

  it('throws when the storage unit does not exist', async () => {
    repo.findOne.mockResolvedValue(undefined);
    await expect(useCase.call('s1')).rejects.toThrow('StorageUnit não encontrado');
  });

  it('deletes an existing storage unit', async () => {
    repo.findOne.mockResolvedValue({ id: 's1' } as StorageUnit);
    repo.delete.mockResolvedValue({ id: 's1' } as StorageUnit);
    await useCase.call('s1');
    expect(repo.delete).toHaveBeenCalledWith({ id: 's1' });
  });
});
