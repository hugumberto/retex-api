import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { BlogPostStatus } from '../../../../domain/blog-post/blog-post-status.enum';
import { BlogPost } from '../../../../domain/blog-post/blog-post.entity';
import { IBlogPostRepository } from '../../../../domain/blog-post/blog-post.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { PublishBlogPostUseCase } from '.';

describe('PublishBlogPostUseCase', () => {
  const repo = mock<IBlogPostRepository>();
  let useCase: PublishBlogPostUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        PublishBlogPostUseCase,
        { provide: DOMAIN_TOKENS.BLOG_POST_REPOSITORY, useValue: repo },
      ],
    }).compile();
    useCase = module.get(PublishBlogPostUseCase);
  });

  it('throws when the post does not exist', async () => {
    repo.findOne.mockResolvedValue(undefined);
    await expect(useCase.call({ id: 'p1' })).rejects.toThrow(NotFoundException);
  });

  it('publishes the post', async () => {
    repo.findOne.mockResolvedValue({ id: 'p1' } as BlogPost);
    repo.update.mockResolvedValue([{ id: 'p1' } as BlogPost]);
    await useCase.call({ id: 'p1' });
    expect(repo.update).toHaveBeenCalledWith(
      { id: 'p1' },
      expect.objectContaining({ status: BlogPostStatus.PUBLISHED }),
    );
  });
});
