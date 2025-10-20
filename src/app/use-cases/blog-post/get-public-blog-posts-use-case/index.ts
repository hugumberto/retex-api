import { Inject, Injectable } from '@nestjs/common';
import { BlogPost } from '../../../../domain/blog-post/blog-post.entity';
import { IBlogPostRepository } from '../../../../domain/blog-post/blog-post.repository';
import { PaginatedResult } from '../../../../domain/interfaces/pagination.interface';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { GetPublicBlogPostsDto } from './get-public-blog-posts.dto';

@Injectable()
export class GetPublicBlogPostsUseCase implements IUseCase<GetPublicBlogPostsDto, PaginatedResult<BlogPost>> {
  constructor(
    @Inject(DOMAIN_TOKENS.BLOG_POST_REPOSITORY)
    private readonly blogPostRepository: IBlogPostRepository,
  ) { }

  async call(param: GetPublicBlogPostsDto): Promise<PaginatedResult<BlogPost>> {
    const pagination = {
      page: param.page || 1,
      limit: param.limit || 10,
    };

    return this.blogPostRepository.findPublicPostsWithPagination(param.search, pagination);
  }
}
