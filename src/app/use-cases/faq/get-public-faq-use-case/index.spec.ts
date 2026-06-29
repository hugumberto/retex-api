import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { FaqCategory } from '../../../../domain/faq/faq-category.entity';
import { IFaqCategoryRepository } from '../../../../domain/faq/faq-category.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { GetPublicFaqUseCase } from '.';

describe('GetPublicFaqUseCase', () => {
  const repo = mock<IFaqCategoryRepository>();
  let useCase: GetPublicFaqUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        GetPublicFaqUseCase,
        { provide: DOMAIN_TOKENS.FAQ_CATEGORY_REPOSITORY, useValue: repo },
      ],
    }).compile();
    useCase = module.get(GetPublicFaqUseCase);
  });

  it('returns active categories wrapped as { category }', async () => {
    repo.findActiveWithItems.mockResolvedValue([{ id: 'c1' } as FaqCategory]);
    expect(await useCase.call()).toEqual([{ category: { id: 'c1' } }]);
  });
});
