import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { IBlogPostRepository } from '../../../../domain/blog-post/blog-post.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { GetPublicBlogPostsUseCase } from '.';

describe('GetPublicBlogPostsUseCase', () => {
  const repo = mock<IBlogPostRepository>();
  let useCase: GetPublicBlogPostsUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        GetPublicBlogPostsUseCase,
        { provide: DOMAIN_TOKENS.BLOG_POST_REPOSITORY, useValue: repo },
      ],
    }).compile();
    useCase = module.get(GetPublicBlogPostsUseCase);
  });

  it('paginates published posts with defaults', async () => {
    const result = { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } };
    repo.findPublicPostsWithPagination.mockResolvedValue(result);

    await useCase.call({ search: 'moda' } as any);

    expect(repo.findPublicPostsWithPagination).toHaveBeenCalledWith(
      'moda',
      expect.objectContaining({ page: 1, limit: 10 }),
    );
  });
});
