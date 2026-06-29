import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { Item } from '../../../../domain/item/item.entity';
import { IItemRepository } from '../../../../domain/item/item.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { DeleteItemUseCase } from '.';

describe('DeleteItemUseCase', () => {
  const repo = mock<IItemRepository>();
  let useCase: DeleteItemUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        DeleteItemUseCase,
        { provide: DOMAIN_TOKENS.ITEM_REPOSITORY, useValue: repo },
      ],
    }).compile();
    useCase = module.get(DeleteItemUseCase);
  });

  it('throws when the item does not exist', async () => {
    repo.findOne.mockResolvedValue(undefined);
    await expect(useCase.call('i1')).rejects.toThrow(NotFoundException);
  });

  it('deletes an existing item', async () => {
    repo.findOne.mockResolvedValue({ id: 'i1' } as Item);
    repo.delete.mockResolvedValue({ id: 'i1' } as Item);
    await useCase.call('i1');
    expect(repo.delete).toHaveBeenCalledWith({ id: 'i1' });
  });
});
