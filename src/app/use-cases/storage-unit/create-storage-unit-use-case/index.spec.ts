import { BadRequestException } from '@nestjs/common';
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

  it('creates the storage unit with its basic indicators', async () => {
    repo.create.mockResolvedValue({ id: 's1' } as StorageUnit);
    await useCase.call({
      group: 'MEN',
      type: 'UPPER_PART',
      season: 'SUMMER',
      location: ' A1 ',
    } as any);
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        group: 'MEN',
        type: 'UPPER_PART',
        season: 'SUMMER',
        location: 'A1',
        weight: 0,
      }),
    );
  });

  it('cria o lote não reutilizável sem estação nem parte', async () => {
    repo.create.mockResolvedValue({ id: 's1' } as StorageUnit);
    await useCase.call({ group: 'NON_REUSABLE' } as any);
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ group: 'NON_REUSABLE', season: null, type: null }),
    );
  });

  it('rejeita lote não reutilizável com estação', async () => {
    await expect(
      useCase.call({ group: 'NON_REUSABLE', season: 'SUMMER' } as any),
    ).rejects.toThrow(BadRequestException);
    expect(repo.create).not.toHaveBeenCalled();
  });
});
