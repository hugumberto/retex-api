import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { BlogCategory } from '../../../../domain/blog-post/blog-category.entity';
import { IBlogCategoryRepository } from '../../../../domain/blog-post/blog-category.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { GetAllBlogCategoriesUseCase } from '.';

describe('GetAllBlogCategoriesUseCase', () => {
  const repo = mock<IBlogCategoryRepository>();
  let useCase: GetAllBlogCategoriesUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        GetAllBlogCategoriesUseCase,
        { provide: DOMAIN_TOKENS.BLOG_CATEGORY_REPOSITORY, useValue: repo },
      ],
    }).compile();
    useCase = module.get(GetAllBlogCategoriesUseCase);
  });

  it('returns all categories by default', async () => {
    const cats = [{ id: 'c1' } as BlogCategory];
    repo.findAll.mockResolvedValue(cats);
    expect(await useCase.call()).toBe(cats);
  });

  it('returns only active categories when requested', async () => {
    const cats = [{ id: 'c1' } as BlogCategory];
    repo.findActive.mockResolvedValue(cats);
    expect(await useCase.call({ onlyActive: true })).toBe(cats);
  });
});
