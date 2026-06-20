import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { BlogPost } from '../../../../domain/blog-post/blog-post.entity';
import { IBlogPostRepository } from '../../../../domain/blog-post/blog-post.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { DeleteBlogPostUseCase } from '.';

describe('DeleteBlogPostUseCase', () => {
  const repo = mock<IBlogPostRepository>();
  let useCase: DeleteBlogPostUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        DeleteBlogPostUseCase,
        { provide: DOMAIN_TOKENS.BLOG_POST_REPOSITORY, useValue: repo },
      ],
    }).compile();
    useCase = module.get(DeleteBlogPostUseCase);
  });

  it('throws when the post does not exist', async () => {
    repo.findOne.mockResolvedValue(undefined);
    await expect(useCase.call({ id: 'p1' })).rejects.toThrow(NotFoundException);
  });

  it('deletes an existing post', async () => {
    repo.findOne.mockResolvedValue({ id: 'p1' } as BlogPost);
    repo.delete.mockResolvedValue({ id: 'p1' } as BlogPost);
    await useCase.call({ id: 'p1' });
    expect(repo.delete).toHaveBeenCalledWith({ id: 'p1' });
  });
});
