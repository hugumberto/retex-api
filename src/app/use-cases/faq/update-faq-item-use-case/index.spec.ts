import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { FaqItem } from '../../../../domain/faq/faq-item.entity';
import { IFaqItemRepository } from '../../../../domain/faq/faq-item.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { UpdateFaqItemUseCase } from '.';

describe('UpdateFaqItemUseCase', () => {
  const repo = mock<IFaqItemRepository>();
  let useCase: UpdateFaqItemUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        UpdateFaqItemUseCase,
        { provide: DOMAIN_TOKENS.FAQ_ITEM_REPOSITORY, useValue: repo },
      ],
    }).compile();
    useCase = module.get(UpdateFaqItemUseCase);
  });

  it('throws when the item does not exist', async () => {
    repo.findOne.mockResolvedValue(undefined);
    await expect(useCase.call({ id: 'it1' } as any)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('updates an existing item', async () => {
    repo.findOne.mockResolvedValue({ id: 'it1' } as FaqItem);
    repo.update.mockResolvedValue([{ id: 'it1' } as FaqItem]);
    await useCase.call({ id: 'it1', title: 'New' } as any);
    expect(repo.update).toHaveBeenCalled();
  });
});
