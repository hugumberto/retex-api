import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { FaqCategory } from '../../../../domain/faq/faq-category.entity';
import { IFaqCategoryRepository } from '../../../../domain/faq/faq-category.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { GetAllFaqCategoriesUseCase } from '.';

describe('GetAllFaqCategoriesUseCase', () => {
  const repo = mock<IFaqCategoryRepository>();
  let useCase: GetAllFaqCategoriesUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        GetAllFaqCategoriesUseCase,
        { provide: DOMAIN_TOKENS.FAQ_CATEGORY_REPOSITORY, useValue: repo },
      ],
    }).compile();
    useCase = module.get(GetAllFaqCategoriesUseCase);
  });

  it('returns all categories with items', async () => {
    const cats = [{ id: 'c1' } as FaqCategory];
    repo.findAllWithItems.mockResolvedValue(cats);
    expect(await useCase.call()).toBe(cats);
  });
});
