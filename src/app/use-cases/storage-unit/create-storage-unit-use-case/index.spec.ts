import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { IBrandRepository } from '../../../../domain/brand/brand.repository';
import { StorageUnit } from '../../../../domain/storage-unit/storage-unit.entity';
import { IStorageUnitRepository } from '../../../../domain/storage-unit/storage-unit.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { CreateStorageUnitUseCase } from '.';

describe('CreateStorageUnitUseCase', () => {
  const repo = mock<IStorageUnitRepository>();
  const brandRepo = mock<IBrandRepository>();
  let useCase: CreateStorageUnitUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        CreateStorageUnitUseCase,
        { provide: DOMAIN_TOKENS.STORAGE_UNIT_REPOSITORY, useValue: repo },
        { provide: DOMAIN_TOKENS.BRAND_REPOSITORY, useValue: brandRepo },
      ],
    }).compile();
    useCase = module.get(CreateStorageUnitUseCase);
  });

  it('throws when the brand does not exist', async () => {
    brandRepo.findOne.mockResolvedValue(undefined);
    await expect(useCase.call({ brandId: 'b1' } as any)).rejects.toThrow(
      'Marca não encontrada',
    );
  });

  it('creates the storage unit when the brand exists', async () => {
    brandRepo.findOne.mockResolvedValue({ id: 'b1' } as any);
    repo.create.mockResolvedValue({ id: 's1' } as StorageUnit);
    await useCase.call({ brandId: 'b1', quality: 'GOOD' } as any);
    expect(repo.create).toHaveBeenCalled();
  });
});
