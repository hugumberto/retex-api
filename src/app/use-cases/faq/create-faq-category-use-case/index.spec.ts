import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { FaqCategory } from '../../../../domain/faq/faq-category.entity';
import { IFaqCategoryRepository } from '../../../../domain/faq/faq-category.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { CreateFaqCategoryUseCase } from '.';

describe('CreateFaqCategoryUseCase', () => {
  const repo = mock<IFaqCategoryRepository>();
  let useCase: CreateFaqCategoryUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        CreateFaqCategoryUseCase,
        { provide: DOMAIN_TOKENS.FAQ_CATEGORY_REPOSITORY, useValue: repo },
      ],
    }).compile();
    useCase = module.get(CreateFaqCategoryUseCase);
  });

  it('creates a category', async () => {
    repo.create.mockResolvedValue({ id: 'c1' } as FaqCategory);
    await useCase.call({ title: 'T', description: 'D' } as any);
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'T', description: 'D' }),
    );
  });
});
