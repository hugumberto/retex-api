import { PaginatedResult, PaginationParams } from '../interfaces/pagination.interface';
import { IRepository } from '../interfaces/repository.interface';
import { BlogCategory } from './blog-category.entity';
import { BlogPostHighlight } from './blog-post-highlight.enum';
import { BlogPostStatus } from './blog-post-status.enum';
import { BlogPost } from './blog-post.entity';

export interface BlogPostFilters {
  status?: BlogPostStatus;
  highlight?: BlogPostHighlight;
  search?: string;
}

export interface IBlogPostRepository extends IRepository<BlogPost> {
  findBySlug(slug: string): Promise<BlogPost>;
  findPublishedBySlug(slug: string): Promise<BlogPost>;
  findByIdWithCategories(id: string): Promise<BlogPost>;
  replaceCategories(postId: string, categories: BlogCategory[]): Promise<void>;
  findByStatus(status: BlogPostStatus): Promise<BlogPost[]>;
  findByHighlight(highlight: BlogPostHighlight): Promise<BlogPost[]>;
  findPublishedPosts(): Promise<BlogPost[]>;
  findOrderedByHighlight(): Promise<BlogPost[]>;
  findPublicPostsWithPagination(
    search: string | undefined,
    pagination: PaginationParams
  ): Promise<PaginatedResult<BlogPost>>;
  findByFiltersWithPagination(
    filters: BlogPostFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResult<BlogPost>>;
}
