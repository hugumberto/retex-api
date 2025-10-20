import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { BlogPostHighlight } from '../../../../domain/blog-post/blog-post-highlight.enum';
import { BlogPostStatus } from '../../../../domain/blog-post/blog-post-status.enum';
import { BlogPost } from '../../../../domain/blog-post/blog-post.entity';
import { BlogPostFilters, IBlogPostRepository } from '../../../../domain/blog-post/blog-post.repository';
import { PaginatedResult, PaginationParams } from '../../../../domain/interfaces/pagination.interface';
import { BaseRepository } from '../abstraction/base.repository';
import { blogPostSchema } from './blog-post.schema';

@Injectable()
export class BlogPostRepository
  extends BaseRepository<BlogPost>
  implements IBlogPostRepository {
  constructor(
    @InjectRepository(blogPostSchema)
    private readonly blogPostRepository: Repository<BlogPost>,
  ) {
    super(blogPostRepository);
  }

  async findBySlug(slug: string): Promise<BlogPost> {
    return this.blogPostRepository.findOne({
      where: { slug } as FindOptionsWhere<BlogPost>,
    });
  }

  async findByStatus(status: BlogPostStatus): Promise<BlogPost[]> {
    return this.blogPostRepository.find({
      where: { status } as FindOptionsWhere<BlogPost>,
      order: { createdAt: 'DESC' },
    });
  }

  async findByHighlight(highlight: BlogPostHighlight): Promise<BlogPost[]> {
    return this.blogPostRepository.find({
      where: { highlight } as FindOptionsWhere<BlogPost>,
      order: { createdAt: 'DESC' },
    });
  }

  async findPublishedPosts(): Promise<BlogPost[]> {
    return this.blogPostRepository.find({
      where: { status: BlogPostStatus.PUBLISHED } as FindOptionsWhere<BlogPost>,
      order: { publishDate: 'DESC' },
    });
  }

  async findOrderedByHighlight(): Promise<BlogPost[]> {
    return this.blogPostRepository.find({
      where: { status: BlogPostStatus.PUBLISHED } as FindOptionsWhere<BlogPost>,
      order: {
        highlight: 'DESC', // HIGHLIGHTED (2) > FEATURED (1) > NONE (0)
        publishDate: 'DESC'
      },
    });
  }

  async findPublicPostsWithPagination(
    search: string | undefined,
    pagination: PaginationParams
  ): Promise<PaginatedResult<BlogPost>> {
    const queryBuilder = this.blogPostRepository.createQueryBuilder('blog_post');

    // Filtrar apenas posts publicados
    queryBuilder.where('blog_post.status = :status', { status: BlogPostStatus.PUBLISHED });

    // Aplicar busca se fornecida
    if (search) {
      queryBuilder.andWhere(
        '(blog_post.title ILIKE :search OR blog_post.body ILIKE :search OR blog_post.tags::text ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Aplicar paginação
    const offset = (pagination.page - 1) * pagination.limit;
    queryBuilder.skip(offset).take(pagination.limit);

    // Ordenar por highlight e depois por data de publicação
    queryBuilder.orderBy('blog_post.highlight', 'DESC')
      .addOrderBy('blog_post.publishDate', 'DESC');

    // Executar consulta
    const [data, total] = await queryBuilder.getManyAndCount();

    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data,
      meta: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages,
      },
    };
  }

  async findByFiltersWithPagination(
    filters: BlogPostFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResult<BlogPost>> {
    const queryBuilder = this.blogPostRepository.createQueryBuilder('blog_post');

    // Aplicar filtros
    if (filters.status) {
      queryBuilder.andWhere('blog_post.status = :status', { status: filters.status });
    }

    if (filters.highlight !== undefined) {
      queryBuilder.andWhere('blog_post.highlight = :highlight', { highlight: filters.highlight });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(blog_post.title ILIKE :search OR blog_post.body ILIKE :search OR blog_post.tags::text ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    // Aplicar paginação
    const offset = (pagination.page - 1) * pagination.limit;
    queryBuilder.skip(offset).take(pagination.limit);

    // Ordenar por data de criação (mais recentes primeiro)
    queryBuilder.orderBy('blog_post.createdAt', 'DESC');

    // Executar consulta
    const [data, total] = await queryBuilder.getManyAndCount();

    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data,
      meta: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages,
      },
    };
  }
}
