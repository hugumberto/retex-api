import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
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
  ) { }

  async call(param: UpsertBlogPostDto): Promise<BlogPost> {
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

      return updatedPosts[0];
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
    };

    return this.blogPostRepository.create(newPost);
  }
}
