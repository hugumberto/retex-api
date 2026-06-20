import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
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

  async call(param: UpsertBlogPostDto): Promise<BlogPost> {
    // Resolve as categorias (quando enviadas) para entidades existentes.
    const categories = await this.resolveCategories(param.categoryIds);

    // Se tem ID, é update
    if (param.id) {
      const existingPost = await this.blogPostRepository.findOne({ id: param.id });
      if (!existingPost) {
        throw new NotFoundException('Post não encontrado');
      }

      // Verificar se slug já existe em outro post
      const postWithSameSlug = await this.blogPostRepository.findBySlug(param.slug);
      if (postWithSameSlug && postWithSameSlug.id !== param.id) {
        throw new ConflictException('Já existe um post com este slug');
      }

      // Atualizar post existente
      const updatedPosts = await this.blogPostRepository.update(
        { id: param.id },
        {
          body: param.body,
          slug: param.slug,
          title: param.title,
          hero: param.hero,
          status: BlogPostStatus.DRAFT,
          highlight: param.highlight,
          tags: param.tags,
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
      throw new ConflictException('Já existe um post com este slug');
    }

    // Criar novo post
    const newPost: Partial<BlogPost> = {
      body: param.body,
      slug: param.slug,
      title: param.title,
      hero: param.hero,
      status: BlogPostStatus.DRAFT,
      highlight: param.highlight,
      tags: param.tags,
      categories: categories ?? [],
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
      throw new NotFoundException('Uma ou mais categorias não foram encontradas');
    }
    return categories;
  }
}
