import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { ILocalStorageService } from '../../../../app/services/local-storage/local-storage.service';
import { SERVICE_TOKENS } from '../../../../app/services/tokens';
import { BlogCategory } from '../../../../domain/blog-post/blog-category.entity';
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
    blogPostRepository: Repository<BlogPost>,
    @Inject(SERVICE_TOKENS.LOCAL_STORAGE_SERVICE)
    localStorageService: ILocalStorageService,
  ) {
    super(blogPostRepository, localStorageService);
  }

  async publishDue(now = new Date()): Promise<void> {
    const repository = await this.getRepository();
    await repository.manager.query(
      `UPDATE blog_post SET status = 'PUBLISHED', updated_at = now()
        WHERE status = 'SCHEDULED' AND publish_date <= $1 AND deleted_at IS NULL`,
      [now],
    );
  }

  async replaceHighlight(from: BlogPostHighlight, to: BlogPostHighlight, exceptId: string): Promise<void> {
    const repository = await this.getRepository();
    await repository.manager.query(
      `UPDATE blog_post SET highlight = $2, updated_at = now()
        WHERE highlight = $1 AND id <> $3 AND deleted_at IS NULL`,
      [from, to, exceptId],
    );
  }

  async findBySlug(slug: string): Promise<BlogPost> {
    const repository = await this.getRepository();
    return repository.findOne({
      where: { slug } as FindOptionsWhere<BlogPost>,
      relations: ['categories'],
    });
  }

  async findPublishedBySlug(slug: string): Promise<BlogPost> {
    await this.publishDue();
    const repository = await this.getRepository();
    return repository.findOne({
      where: { slug, status: BlogPostStatus.PUBLISHED } as FindOptionsWhere<BlogPost>,
      relations: ['categories'],
    });
  }

  async findByIdWithCategories(id: string): Promise<BlogPost> {
    const repository = await this.getRepository();
    return repository.findOne({
      where: { id } as FindOptionsWhere<BlogPost>,
      relations: ['categories'],
    });
  }

  async replaceCategories(postId: string, categories: BlogCategory[]): Promise<void> {
    const repository = await this.getRepository();
    const post = await repository.findOne({
      where: { id: postId } as FindOptionsWhere<BlogPost>,
      relations: ['categories'],
    });
    if (!post) return;
    post.categories = categories;
    await repository.save(post);
  }

  async findByStatus(status: BlogPostStatus): Promise<BlogPost[]> {
    const repository = await this.getRepository();
    return repository.find({
      where: { status } as FindOptionsWhere<BlogPost>,
      order: { createdAt: 'DESC' },
    });
  }

  async findByHighlight(highlight: BlogPostHighlight): Promise<BlogPost[]> {
    const repository = await this.getRepository();
    return repository.find({
      where: { highlight } as FindOptionsWhere<BlogPost>,
      order: { createdAt: 'DESC' },
    });
  }

  async findPublishedPosts(): Promise<BlogPost[]> {
    const repository = await this.getRepository();
    return repository.find({
      where: { status: BlogPostStatus.PUBLISHED } as FindOptionsWhere<BlogPost>,
      order: { publishDate: 'DESC' },
    });
  }

  async findOrderedByHighlight(): Promise<BlogPost[]> {
    const repository = await this.getRepository();
    return repository.find({
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
    await this.publishDue();
    const repository = await this.getRepository();
    const queryBuilder = repository.createQueryBuilder('blog_post');
    queryBuilder.leftJoinAndSelect('blog_post.categories', 'categories');

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
    await this.publishDue();
    const repository = await this.getRepository();
    const queryBuilder = repository.createQueryBuilder('blog_post');
    queryBuilder.leftJoinAndSelect('blog_post.categories', 'categories');

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

    if (filters.categoryId) {
      queryBuilder.andWhere(
        'EXISTS (SELECT 1 FROM blog_post_categories pc WHERE pc.post_id = blog_post.id AND pc.category_id = :categoryId)',
        { categoryId: filters.categoryId },
      );
    }

    // Aplicar paginação
    const offset = (pagination.page - 1) * pagination.limit;
    queryBuilder.skip(offset).take(pagination.limit);

    if (filters.sort === 'oldest') queryBuilder.orderBy('blog_post.updatedAt', 'ASC');
    else if (filters.sort === 'title') queryBuilder.orderBy('blog_post.title', 'ASC');
    else queryBuilder.orderBy('blog_post.updatedAt', 'DESC');

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
