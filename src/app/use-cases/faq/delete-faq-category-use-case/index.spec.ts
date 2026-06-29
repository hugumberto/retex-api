import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { FaqCategory } from '../../../../domain/faq/faq-category.entity';
import { IFaqCategoryRepository } from '../../../../domain/faq/faq-category.repository';
import { FaqItem } from '../../../../domain/faq/faq-item.entity';
import { IFaqItemRepository } from '../../../../domain/faq/faq-item.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { DeleteFaqCategoryUseCase } from '.';

describe('DeleteFaqCategoryUseCase', () => {
  let useCase: DeleteFaqCategoryUseCase;
  const faqCategoryRepositoryMock = mock<IFaqCategoryRepository>();
  const faqItemRepositoryMock = mock<IFaqItemRepository>();

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        DeleteFaqCategoryUseCase,
        { provide: DOMAIN_TOKENS.FAQ_CATEGORY_REPOSITORY, useValue: faqCategoryRepositoryMock },
        { provide: DOMAIN_TOKENS.FAQ_ITEM_REPOSITORY, useValue: faqItemRepositoryMock },
      ],
    }).compile();
    useCase = module.get(DeleteFaqCategoryUseCase);
  });

  it('throws NotFound when the category does not exist', async () => {
    faqCategoryRepositoryMock.findOne.mockResolvedValue(undefined);
    await expect(useCase.call({ id: 'missing' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('deletes the category items first, then the category', async () => {
    faqCategoryRepositoryMock.findOne.mockResolvedValue({ id: 'c1' } as FaqCategory);
    faqItemRepositoryMock.findByCategory.mockResolvedValue([
      { id: 'it1' } as FaqItem,
      { id: 'it2' } as FaqItem,
    ]);

    await useCase.call({ id: 'c1' });

    expect(faqItemRepositoryMock.delete).toHaveBeenCalledTimes(2);
    expect(faqItemRepositoryMock.delete).toHaveBeenCalledWith({ id: 'it1' });
    expect(faqCategoryRepositoryMock.delete).toHaveBeenCalledWith({ id: 'c1' });
  });
});
