import { Inject, Injectable } from '@nestjs/common';
import { BlogPost } from '../../../../domain/blog-post/blog-post.entity';
import { IBlogPostRepository } from '../../../../domain/blog-post/blog-post.repository';
import { PaginatedResult } from '../../../../domain/interfaces/pagination.interface';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { GetAllBlogPostsDto } from './get-all-blog-posts.dto';

@Injectable()
export class GetAllBlogPostsUseCase implements IUseCase<GetAllBlogPostsDto, PaginatedResult<BlogPost>> {
  constructor(
    @Inject(DOMAIN_TOKENS.BLOG_POST_REPOSITORY)
    private readonly blogPostRepository: IBlogPostRepository,
  ) { }

  async call(param: GetAllBlogPostsDto): Promise<PaginatedResult<BlogPost>> {
    const filters = {
      status: param.status,
      highlight: param.highlight,
      search: param.search,
    };

    const pagination = {
      page: param.page || 1,
      limit: param.limit || 10,
    };

    return this.blogPostRepository.findByFiltersWithPagination(filters, pagination);
  }
}
