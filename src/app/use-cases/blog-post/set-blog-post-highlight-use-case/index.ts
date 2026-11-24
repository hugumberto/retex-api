import { IsEnum } from 'class-validator';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BlogPostHighlight } from '../../../../domain/blog-post/blog-post-highlight.enum';
import { BlogPost } from '../../../../domain/blog-post/blog-post.entity';
import { IBlogPostRepository } from '../../../../domain/blog-post/blog-post.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

export class SetBlogPostHighlightDto {
  @IsEnum(BlogPostHighlight)
  highlight: BlogPostHighlight;
}

/** A estrela da lista: muda só o destaque. O principal é único; o anterior passa a secundário. */
@Injectable()
export class SetBlogPostHighlightUseCase
  implements IUseCase<{ id: string; highlight: BlogPostHighlight }, BlogPost>
{
  constructor(
    @Inject(DOMAIN_TOKENS.BLOG_POST_REPOSITORY)
    private readonly blogPostRepository: IBlogPostRepository,
  ) {}

  async call({ id, highlight }: { id: string; highlight: BlogPostHighlight }): Promise<BlogPost> {
    const existing = await this.blogPostRepository.findOne({ id });
    if (!existing) throw new NotFoundException('errors.blogPost.notFound');
    const [updated] = await this.blogPostRepository.update({ id }, { highlight });
    if (highlight === BlogPostHighlight.HIGHLIGHTED) {
      await this.blogPostRepository.replaceHighlight(
        BlogPostHighlight.HIGHLIGHTED,
        BlogPostHighlight.FEATURED,
        id,
      );
    }
    return updated;
  }
}
