import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BlogPostHighlight } from '../../../../domain/blog-post/blog-post-highlight.enum';
import { BlogCategory } from '../../../../domain/blog-post/blog-category.entity';
import { IBlogCategoryRepository } from '../../../../domain/blog-post/blog-category.repository';
import { BlogPostStatus } from '../../../../domain/blog-post/blog-post-status.enum';
import { BlogPost } from '../../../../domain/blog-post/blog-post.entity';
import { IBlogPostRepository } from '../../../../domain/blog-post/blog-post.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { UpsertBlogPostDto } from './upsert-blog-post.dto';

@Injectable()
export class UpsertBlogPostUseCase implements IUseCase<UpsertBlogPostDto, BlogPost> {
  constructor(
    @Inject(DOMAIN_TOKENS.BLOG_POST_REPOSITORY)
    private readonly blogPostRepository: IBlogPostRepository,
    @Inject(DOMAIN_TOKENS.BLOG_CATEGORY_REPOSITORY)
    private readonly blogCategoryRepository: IBlogCategoryRepository,
  ) { }

  async call(param: UpsertBlogPostDto, now = new Date()): Promise<BlogPost> {
    // Resolve as categorias (quando enviadas) para entidades existentes.
    const categories = await this.resolveCategories(param.categoryIds);
    const post = await this.save(param, categories, now);
    // Destaque principal: só um artigo de cada vez; o anterior passa a secundário.
    if (param.highlight === BlogPostHighlight.HIGHLIGHTED) {
      await this.blogPostRepository.replaceHighlight(
        BlogPostHighlight.HIGHLIGHTED,
        BlogPostHighlight.FEATURED,
        post.id,
      );
    }
    return post;
  }

  /** Estado e data de publicação a gravar, a partir do pedido e do que o artigo já tinha. */
  private publication(
    param: UpsertBlogPostDto,
    existing: BlogPost | null,
    now: Date,
  ): Pick<BlogPost, 'status' | 'publishDate'> {
    const status = param.status ?? existing?.status ?? BlogPostStatus.DRAFT;
    if (status === BlogPostStatus.SCHEDULED) {
      const date = param.publishDate ? new Date(param.publishDate) : existing?.publishDate;
      if (!date || new Date(date).getTime() <= now.getTime()) {
        throw new BadRequestException('errors.blogPost.scheduleInPast');
      }
      return { status, publishDate: new Date(date) };
    }
    if (status === BlogPostStatus.PUBLISHED) {
      // Mantém a data de quando foi publicado pela primeira vez.
      const keep = existing?.status === BlogPostStatus.PUBLISHED && existing.publishDate;
      return { status, publishDate: keep ? existing.publishDate : now };
    }
    return { status, publishDate: existing?.status === BlogPostStatus.DRAFT ? existing.publishDate ?? null : null };
  }

  private async save(
    param: UpsertBlogPostDto,
    categories: BlogCategory[] | undefined,
    now: Date,
  ): Promise<BlogPost> {

    // Se tem ID, é update
    if (param.id) {
      const existingPost = await this.blogPostRepository.findOne({ id: param.id });
      if (!existingPost) {
        throw new NotFoundException('errors.blogPost.notFound');
      }

      // Verificar se slug já existe em outro post
      const postWithSameSlug = await this.blogPostRepository.findBySlug(param.slug);
      if (postWithSameSlug && postWithSameSlug.id !== param.id) {
        throw new ConflictException('errors.blogPost.duplicateSlug');
      }

      // Sem `status`, preserva o estado atual: editar (ex.: corrigir um typo)
      // não deve despublicar silenciosamente um post PUBLISHED.
      const updatedPosts = await this.blogPostRepository.update(
        { id: param.id },
        {
          body: param.body,
          slug: param.slug,
          title: param.title,
          hero: param.hero,
          highlight: param.highlight,
          tags: param.tags,
          ...(param.summary !== undefined ? { summary: param.summary?.trim() || null } : {}),
          ...(param.heroAlt !== undefined ? { heroAlt: param.heroAlt?.trim() || null } : {}),
          ...this.publication(param, existingPost, now),
        }
      );

      // Só mexe nas categorias quando o campo foi enviado.
      if (categories !== undefined) {
        await this.blogPostRepository.replaceCategories(param.id, categories);
      }

      return (await this.blogPostRepository.findByIdWithCategories(param.id)) ?? updatedPosts[0];
    }

    // Se não tem ID, é create
    // Verificar se slug já existe
    const existingPostBySlug = await this.blogPostRepository.findBySlug(param.slug);
    if (existingPostBySlug) {
      throw new ConflictException('errors.blogPost.duplicateSlug');
    }

    // Criar novo post
    const newPost: Partial<BlogPost> = {
      body: param.body,
      slug: param.slug,
      title: param.title,
      hero: param.hero,
      highlight: param.highlight,
      tags: param.tags,
      summary: param.summary?.trim() || null,
      heroAlt: param.heroAlt?.trim() || null,
      categories: categories ?? [],
      ...this.publication(param, null, now),
    };

    return this.blogPostRepository.create(newPost);
  }

  private async resolveCategories(
    categoryIds?: string[],
  ): Promise<BlogCategory[] | undefined> {
    if (categoryIds === undefined) return undefined;
    if (categoryIds.length === 0) return [];

    // Remover duplicados: senão `['a','a']` faz `categories.length` (1) !==
    // `categoryIds.length` (2) e rejeita IDs válidos com um falso NotFound.
    const uniqueIds = [...new Set(categoryIds)];

    const categories = await this.blogCategoryRepository.findByIds(uniqueIds);
    if (categories.length !== uniqueIds.length) {
      throw new NotFoundException('errors.category.someNotFound');
    }
    return categories;
  }
}
