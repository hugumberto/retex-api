import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { IBlogCategoryRepository } from '../../../../domain/blog-post/blog-category.repository';
import { BlogPostStatus } from '../../../../domain/blog-post/blog-post-status.enum';
import { BlogPost } from '../../../../domain/blog-post/blog-post.entity';
import { IBlogPostRepository } from '../../../../domain/blog-post/blog-post.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { UpsertBlogPostUseCase } from '.';

describe('UpsertBlogPostUseCase', () => {
  let useCase: UpsertBlogPostUseCase;
  const blogPostRepositoryMock = mock<IBlogPostRepository>();
  const blogCategoryRepositoryMock = mock<IBlogCategoryRepository>();

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        UpsertBlogPostUseCase,
        { provide: DOMAIN_TOKENS.BLOG_POST_REPOSITORY, useValue: blogPostRepositoryMock },
        { provide: DOMAIN_TOKENS.BLOG_CATEGORY_REPOSITORY, useValue: blogCategoryRepositoryMock },
      ],
    }).compile();
    useCase = module.get(UpsertBlogPostUseCase);
  });

  const newPostParam = {
    body: '<p>hi</p>', slug: 'my-post', title: 'My Post', hero: 'data:...', highlight: 2, tags: [],
  } as any;

  it('creates a new post as DRAFT when the slug is free', async () => {
    blogPostRepositoryMock.findBySlug.mockResolvedValue(undefined);
    blogPostRepositoryMock.create.mockResolvedValue({ id: 'p1' } as BlogPost);

    await useCase.call(newPostParam);

    expect(blogPostRepositoryMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: 'my-post',
        status: BlogPostStatus.DRAFT,
        highlight: 2,
        categories: [],
      }),
    );
  });

  it('rejects creating a post with an existing slug', async () => {
    blogPostRepositoryMock.findBySlug.mockResolvedValue({ id: 'other' } as BlogPost);
    await expect(useCase.call(newPostParam)).rejects.toThrow(ConflictException);
  });

  it('resolves provided categories and fails when some are missing', async () => {
    blogPostRepositoryMock.findBySlug.mockResolvedValue(undefined);
    blogCategoryRepositoryMock.findByIds.mockResolvedValue([{ id: 'c1' } as any]);

    await expect(
      useCase.call({ ...newPostParam, categoryIds: ['c1', 'c2'] }),
    ).rejects.toThrow(NotFoundException);
  });

  it('updates an existing post and replaces its categories', async () => {
    blogPostRepositoryMock.findOne.mockResolvedValue({ id: 'p1' } as BlogPost);
    blogPostRepositoryMock.findBySlug.mockResolvedValue(undefined);
    blogCategoryRepositoryMock.findByIds.mockResolvedValue([{ id: 'c1' } as any]);
    blogPostRepositoryMock.update.mockResolvedValue([{ id: 'p1' } as BlogPost]);
    blogPostRepositoryMock.findByIdWithCategories.mockResolvedValue({ id: 'p1' } as BlogPost);

    await useCase.call({ ...newPostParam, id: 'p1', categoryIds: ['c1'] });

    expect(blogPostRepositoryMock.update).toHaveBeenCalled();
    expect(blogPostRepositoryMock.replaceCategories).toHaveBeenCalledWith('p1', [
      { id: 'c1' },
    ]);
  });

  it('preserves the current status when editing (does not silently unpublish)', async () => {
    blogPostRepositoryMock.findOne.mockResolvedValue({
      id: 'p1',
      status: BlogPostStatus.PUBLISHED,
    } as BlogPost);
    blogPostRepositoryMock.findBySlug.mockResolvedValue(undefined);
    blogPostRepositoryMock.update.mockResolvedValue([{ id: 'p1' } as BlogPost]);
    blogPostRepositoryMock.findByIdWithCategories.mockResolvedValue({ id: 'p1' } as BlogPost);

    await useCase.call({ ...newPostParam, id: 'p1' });

    expect(blogPostRepositoryMock.update).toHaveBeenCalledWith(
      { id: 'p1' },
      expect.objectContaining({ status: BlogPostStatus.PUBLISHED }),
    );
  });

  it('dedupes repeated categoryIds before validating existence', async () => {
    blogPostRepositoryMock.findBySlug.mockResolvedValue(undefined);
    blogCategoryRepositoryMock.findByIds.mockResolvedValue([{ id: 'c1' } as any]);
    blogPostRepositoryMock.create.mockResolvedValue({ id: 'p1' } as BlogPost);

    await useCase.call({ ...newPostParam, categoryIds: ['c1', 'c1'] });

    expect(blogCategoryRepositoryMock.findByIds).toHaveBeenCalledWith(['c1']);
    expect(blogPostRepositoryMock.create).toHaveBeenCalled();
  });
});
