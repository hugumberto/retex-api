import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BlogPostStatus } from '../../../../domain/blog-post/blog-post-status.enum';
import { BlogPost } from '../../../../domain/blog-post/blog-post.entity';
import { IBlogPostRepository } from '../../../../domain/blog-post/blog-post.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { PublishBlogPostDto } from './publish-blog-post.dto';

@Injectable()
export class PublishBlogPostUseCase implements IUseCase<PublishBlogPostDto, BlogPost> {
  constructor(
    @Inject(DOMAIN_TOKENS.BLOG_POST_REPOSITORY)
    private readonly blogPostRepository: IBlogPostRepository,
  ) { }

  async call(param: PublishBlogPostDto): Promise<BlogPost> {
    const existingPost = await this.blogPostRepository.findOne({ id: param.id });
    if (!existingPost) {
      throw new NotFoundException('Post não encontrado');
    }

    // Atualizar status para PUBLISHED e definir publishDate
    const updatedPosts = await this.blogPostRepository.update(
      { id: param.id },
      {
        status: BlogPostStatus.PUBLISHED,
        publishDate: new Date(),
      }
    );

    return updatedPosts[0];
  }
}
