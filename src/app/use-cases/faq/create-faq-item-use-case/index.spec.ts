import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { FaqCategory } from '../../../../domain/faq/faq-category.entity';
import { IFaqCategoryRepository } from '../../../../domain/faq/faq-category.repository';
import { FaqItem } from '../../../../domain/faq/faq-item.entity';
import { IFaqItemRepository } from '../../../../domain/faq/faq-item.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { CreateFaqItemUseCase } from '.';

describe('CreateFaqItemUseCase', () => {
  const categoryRepo = mock<IFaqCategoryRepository>();
  const itemRepo = mock<IFaqItemRepository>();
  let useCase: CreateFaqItemUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        CreateFaqItemUseCase,
        { provide: DOMAIN_TOKENS.FAQ_CATEGORY_REPOSITORY, useValue: categoryRepo },
        { provide: DOMAIN_TOKENS.FAQ_ITEM_REPOSITORY, useValue: itemRepo },
      ],
    }).compile();
    useCase = module.get(CreateFaqItemUseCase);
  });

  it('throws when the category does not exist', async () => {
    categoryRepo.findOne.mockResolvedValue(undefined);
    await expect(
      useCase.call({ categoryId: 'c1', title: 'Q', description: 'A' } as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('creates the item under the category', async () => {
    categoryRepo.findOne.mockResolvedValue({ id: 'c1' } as FaqCategory);
    itemRepo.create.mockResolvedValue({ id: 'it1' } as FaqItem);
    await useCase.call({ categoryId: 'c1', title: 'Q', description: 'A' } as any);
    expect(itemRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId: 'c1', title: 'Q' }),
    );
  });
});
