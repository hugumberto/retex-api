import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BlogPost } from '../../../../domain/blog-post/blog-post.entity';
import { IBlogPostRepository } from '../../../../domain/blog-post/blog-post.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

/**
 * Post (com categorias) para o ecrã de edição do portal.
 *
 * Antes não existia: o ecrã pedia a listagem inteira com `limit=100` e fazia
 * `.find()` em memória, o que deixaria de encontrar posts assim que houvesse
 * mais de 100.
 */
@Injectable()
export class GetBlogPostByIdUseCase implements IUseCase<string, BlogPost> {
  constructor(
    @Inject(DOMAIN_TOKENS.BLOG_POST_REPOSITORY)
    private readonly blogPostRepository: IBlogPostRepository,
  ) { }

  async call(id: string): Promise<BlogPost> {
    const post = await this.blogPostRepository.findByIdWithCategories(id);

    if (!post) {
      throw new NotFoundException('errors.blogPost.notFound');
    }

    return post;
  }
}
