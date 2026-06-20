import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { FaqItem } from '../../../../domain/faq/faq-item.entity';
import { IFaqItemRepository } from '../../../../domain/faq/faq-item.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { DeleteFaqItemUseCase } from '.';

describe('DeleteFaqItemUseCase', () => {
  const repo = mock<IFaqItemRepository>();
  let useCase: DeleteFaqItemUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        DeleteFaqItemUseCase,
        { provide: DOMAIN_TOKENS.FAQ_ITEM_REPOSITORY, useValue: repo },
      ],
    }).compile();
    useCase = module.get(DeleteFaqItemUseCase);
  });

  it('throws when the item does not exist', async () => {
    repo.findOne.mockResolvedValue(undefined);
    await expect(useCase.call({ id: 'it1' })).rejects.toThrow(NotFoundException);
  });

  it('deletes an existing item', async () => {
    repo.findOne.mockResolvedValue({ id: 'it1' } as FaqItem);
    await useCase.call({ id: 'it1' });
    expect(repo.delete).toHaveBeenCalledWith({ id: 'it1' });
  });
});
