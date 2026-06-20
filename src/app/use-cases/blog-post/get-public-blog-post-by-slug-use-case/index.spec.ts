import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { BlogPost } from '../../../../domain/blog-post/blog-post.entity';
import { IBlogPostRepository } from '../../../../domain/blog-post/blog-post.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { GetPublicBlogPostBySlugUseCase } from '.';

describe('GetPublicBlogPostBySlugUseCase', () => {
  const repo = mock<IBlogPostRepository>();
  let useCase: GetPublicBlogPostBySlugUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        GetPublicBlogPostBySlugUseCase,
        { provide: DOMAIN_TOKENS.BLOG_POST_REPOSITORY, useValue: repo },
      ],
    }).compile();
    useCase = module.get(GetPublicBlogPostBySlugUseCase);
  });

  it('throws when no published post matches the slug', async () => {
    repo.findPublishedBySlug.mockResolvedValue(undefined);
    await expect(useCase.call({ slug: 'x' })).rejects.toThrow(NotFoundException);
  });

  it('returns the published post', async () => {
    const post = { id: 'p1' } as BlogPost;
    repo.findPublishedBySlug.mockResolvedValue(post);
    expect(await useCase.call({ slug: 'my-post' })).toBe(post);
  });
});
