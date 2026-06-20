import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { BlogCategory } from '../../../../domain/blog-post/blog-category.entity';
import { IBlogCategoryRepository } from '../../../../domain/blog-post/blog-category.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { DeleteBlogCategoryUseCase } from '.';

describe('DeleteBlogCategoryUseCase', () => {
  const repo = mock<IBlogCategoryRepository>();
  let useCase: DeleteBlogCategoryUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        DeleteBlogCategoryUseCase,
        { provide: DOMAIN_TOKENS.BLOG_CATEGORY_REPOSITORY, useValue: repo },
      ],
    }).compile();
    useCase = module.get(DeleteBlogCategoryUseCase);
  });

  it('throws when the category does not exist', async () => {
    repo.findOne.mockResolvedValue(undefined);
    await expect(useCase.call({ id: 'c1' })).rejects.toThrow(NotFoundException);
  });

  it('deletes an existing category', async () => {
    repo.findOne.mockResolvedValue({ id: 'c1' } as BlogCategory);
    await useCase.call({ id: 'c1' });
    expect(repo.delete).toHaveBeenCalledWith({ id: 'c1' });
  });
});
