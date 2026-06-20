import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BlogPost } from '../../../../domain/blog-post/blog-post.entity';
import { IBlogPostRepository } from '../../../../domain/blog-post/blog-post.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

@Injectable()
export class GetPublicBlogPostBySlugUseCase
  implements IUseCase<{ slug: string }, BlogPost> {
  constructor(
    @Inject(DOMAIN_TOKENS.BLOG_POST_REPOSITORY)
    private readonly blogPostRepository: IBlogPostRepository,
  ) {}

  async call({ slug }: { slug: string }): Promise<BlogPost> {
    const post = await this.blogPostRepository.findPublishedBySlug(slug);
    if (!post) {
      throw new NotFoundException('Post não encontrado');
    }
    return post;
  }
}
