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
  categoryId?: string;
  // Por omissão, os atualizados mais recentemente primeiro.
  sort?: 'recent' | 'oldest' | 'title';
}

export interface IBlogPostRepository extends IRepository<BlogPost> {
  /** Passa a publicados os agendados cuja data já chegou. */
  publishDue(now?: Date): Promise<void>;
  /** Muda o destaque `from` para `to` em todos os artigos menos `exceptId`. */
  replaceHighlight(from: BlogPostHighlight, to: BlogPostHighlight, exceptId: string): Promise<void>;
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
