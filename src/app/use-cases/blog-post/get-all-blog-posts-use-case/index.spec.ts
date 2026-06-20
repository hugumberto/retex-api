import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { IBlogPostRepository } from '../../../../domain/blog-post/blog-post.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { GetAllBlogPostsUseCase } from '.';

describe('GetAllBlogPostsUseCase', () => {
  const repo = mock<IBlogPostRepository>();
  let useCase: GetAllBlogPostsUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        GetAllBlogPostsUseCase,
        { provide: DOMAIN_TOKENS.BLOG_POST_REPOSITORY, useValue: repo },
      ],
    }).compile();
    useCase = module.get(GetAllBlogPostsUseCase);
  });

  it('paginates posts by filters with defaults', async () => {
    const result = { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } };
    repo.findByFiltersWithPagination.mockResolvedValue(result);

    await useCase.call({} as any);

    expect(repo.findByFiltersWithPagination).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ page: 1, limit: 10 }),
    );
  });
});
