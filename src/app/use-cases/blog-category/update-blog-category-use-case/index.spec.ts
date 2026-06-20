import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { BlogCategory } from '../../../../domain/blog-post/blog-category.entity';
import { IBlogCategoryRepository } from '../../../../domain/blog-post/blog-category.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { UpdateBlogCategoryUseCase } from '.';

describe('UpdateBlogCategoryUseCase', () => {
  const repo = mock<IBlogCategoryRepository>();
  let useCase: UpdateBlogCategoryUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        UpdateBlogCategoryUseCase,
        { provide: DOMAIN_TOKENS.BLOG_CATEGORY_REPOSITORY, useValue: repo },
      ],
    }).compile();
    useCase = module.get(UpdateBlogCategoryUseCase);
  });

  it('throws when the category does not exist', async () => {
    repo.findOne.mockResolvedValue(undefined);
    await expect(useCase.call({ id: 'c1' } as any)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('updates an existing category', async () => {
    repo.findOne.mockResolvedValue({ id: 'c1' } as BlogCategory);
    repo.findBySlug.mockResolvedValue(undefined);
    repo.update.mockResolvedValue([{ id: 'c1' } as BlogCategory]);
    await useCase.call({ id: 'c1', title: 'Nova' } as any);
    expect(repo.update).toHaveBeenCalled();
  });
});
