import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { Item } from '../../../../domain/item/item.entity';
import { IItemRepository } from '../../../../domain/item/item.repository';
import { StorageUnit } from '../../../../domain/storage-unit/storage-unit.entity';
import { IStorageUnitRepository } from '../../../../domain/storage-unit/storage-unit.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { DeleteItemUseCase } from '.';

describe('DeleteItemUseCase', () => {
  const repo = mock<IItemRepository>();
  const storageUnitRepo = mock<IStorageUnitRepository>();
  let useCase: DeleteItemUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        DeleteItemUseCase,
        { provide: DOMAIN_TOKENS.ITEM_REPOSITORY, useValue: repo },
        {
          provide: DOMAIN_TOKENS.STORAGE_UNIT_REPOSITORY,
          useValue: storageUnitRepo,
        },
      ],
    }).compile();
    useCase = module.get(DeleteItemUseCase);
  });

  it('throws when the item does not exist', async () => {
    repo.findByIds.mockResolvedValue([]);
    await expect(useCase.call('i1')).rejects.toThrow(NotFoundException);
  });

  it('deletes an unbound item without touching the counter', async () => {
    repo.findByIds.mockResolvedValue([{ id: 'i1' } as Item]);
    repo.delete.mockResolvedValue({ id: 'i1' } as Item);

    await useCase.call('i1');

    expect(repo.delete).toHaveBeenCalledWith({ id: 'i1' });
    expect(storageUnitRepo.incrementItemsCount).not.toHaveBeenCalled();
  });

  it('decrements the storage unit counter when the item was bound', async () => {
    repo.findByIds.mockResolvedValue([
      { id: 'i1', storageUnit: { id: 'su1' } as StorageUnit } as Item,
    ]);
    repo.delete.mockResolvedValue({ id: 'i1' } as Item);

    await useCase.call('i1');

    expect(repo.delete).toHaveBeenCalledWith({ id: 'i1' });
    expect(storageUnitRepo.incrementItemsCount).toHaveBeenCalledWith('su1', -1);
  });
});
