import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { BlogCategory } from '../../../../domain/blog-post/blog-category.entity';
import { IBlogCategoryRepository } from '../../../../domain/blog-post/blog-category.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { CreateBlogCategoryUseCase } from '.';

describe('CreateBlogCategoryUseCase', () => {
  const repo = mock<IBlogCategoryRepository>();
  let useCase: CreateBlogCategoryUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        CreateBlogCategoryUseCase,
        { provide: DOMAIN_TOKENS.BLOG_CATEGORY_REPOSITORY, useValue: repo },
      ],
    }).compile();
    useCase = module.get(CreateBlogCategoryUseCase);
  });

  it('rejects a duplicate name (slug)', async () => {
    repo.findBySlug.mockResolvedValue({ id: 'c0' } as BlogCategory);
    await expect(useCase.call({ title: 'Moda' } as any)).rejects.toThrow(
      ConflictException,
    );
  });

  it('creates a category with a slug', async () => {
    repo.findBySlug.mockResolvedValue(undefined);
    repo.create.mockResolvedValue({ id: 'c1' } as BlogCategory);
    await useCase.call({ title: 'Moda Circular' } as any);
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'moda-circular' }),
    );
  });
});
