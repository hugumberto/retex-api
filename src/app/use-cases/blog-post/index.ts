import { DeleteBlogPostUseCase } from './delete-blog-post-use-case';
import { GetAllBlogPostsUseCase } from './get-all-blog-posts-use-case';
import { GetPublicBlogPostBySlugUseCase } from './get-public-blog-post-by-slug-use-case';
import { GetPublicBlogPostsUseCase } from './get-public-blog-posts-use-case';
import { PublishBlogPostUseCase } from './publish-blog-post-use-case';
import { UpsertBlogPostUseCase } from './upsert-blog-post-use-case';

export const BLOG_POST_USE_CASES = [
  UpsertBlogPostUseCase,
  PublishBlogPostUseCase,
  DeleteBlogPostUseCase,
  GetPublicBlogPostsUseCase,
  GetPublicBlogPostBySlugUseCase,
  GetAllBlogPostsUseCase,
];
