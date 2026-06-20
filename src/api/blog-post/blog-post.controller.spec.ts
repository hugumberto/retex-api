import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { DeleteBlogPostUseCase } from '../../app/use-cases/blog-post/delete-blog-post-use-case';
import { GetAllBlogPostsUseCase } from '../../app/use-cases/blog-post/get-all-blog-posts-use-case';
import { GetPublicBlogPostBySlugUseCase } from '../../app/use-cases/blog-post/get-public-blog-post-by-slug-use-case';
import { GetPublicBlogPostsUseCase } from '../../app/use-cases/blog-post/get-public-blog-posts-use-case';
import { PublishBlogPostUseCase } from '../../app/use-cases/blog-post/publish-blog-post-use-case';
import { UpsertBlogPostUseCase } from '../../app/use-cases/blog-post/upsert-blog-post-use-case';
import { BlogPostController } from './blog-post.controller';

describe('BlogPostController', () => {
  let controller: BlogPostController;
  const upsert = { call: jest.fn() };
  const publish = { call: jest.fn() };
  const del = { call: jest.fn() };
  const getPublic = { call: jest.fn() };
  const getBySlug = { call: jest.fn() };
  const getAll = { call: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      controllers: [BlogPostController],
      providers: [
        { provide: UpsertBlogPostUseCase, useValue: upsert },
        { provide: PublishBlogPostUseCase, useValue: publish },
        { provide: DeleteBlogPostUseCase, useValue: del },
        { provide: GetPublicBlogPostsUseCase, useValue: getPublic },
        { provide: GetPublicBlogPostBySlugUseCase, useValue: getBySlug },
        { provide: GetAllBlogPostsUseCase, useValue: getAll },
        { provide: JwtService, useValue: {} },
      ],
    }).compile();
    controller = module.get(BlogPostController);
  });

  it('delegates upsert', async () => {
    await controller.upsertBlogPost({ slug: 's' } as any);
    expect(upsert.call).toHaveBeenCalledWith({ slug: 's' });
  });

  it('delegates public get-by-slug', async () => {
    await controller.getPublicBlogPostBySlug('my-slug');
    expect(getBySlug.call).toHaveBeenCalledWith({ slug: 'my-slug' });
  });

  it('delegates delete by id', async () => {
    await controller.deleteBlogPost('p1');
    expect(del.call).toHaveBeenCalledWith({ id: 'p1' });
  });
});
