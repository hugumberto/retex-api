import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BlogPost } from '../../../../domain/blog-post/blog-post.entity';
import { IBlogPostRepository } from '../../../../domain/blog-post/blog-post.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { DeleteBlogPostDto } from './delete-blog-post.dto';

@Injectable()
export class DeleteBlogPostUseCase implements IUseCase<DeleteBlogPostDto, BlogPost> {
  constructor(
    @Inject(DOMAIN_TOKENS.BLOG_POST_REPOSITORY)
    private readonly blogPostRepository: IBlogPostRepository,
  ) { }

  async call(param: DeleteBlogPostDto): Promise<BlogPost> {
    const existingPost = await this.blogPostRepository.findOne({ id: param.id });
    if (!existingPost) {
      throw new NotFoundException('Post não encontrado');
    }

    return this.blogPostRepository.delete({ id: param.id });
  }
}
