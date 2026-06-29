import { Inject, Injectable } from '@nestjs/common';
import { BlogCategory } from '../../../../domain/blog-post/blog-category.entity';
import { IBlogCategoryRepository } from '../../../../domain/blog-post/blog-category.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

interface GetAllBlogCategoriesParam {
  onlyActive?: boolean;
}

@Injectable()
export class GetAllBlogCategoriesUseCase
  implements IUseCase<GetAllBlogCategoriesParam | void, BlogCategory[]> {
  constructor(
    @Inject(DOMAIN_TOKENS.BLOG_CATEGORY_REPOSITORY)
    private readonly blogCategoryRepository: IBlogCategoryRepository,
  ) {}

  async call(param?: GetAllBlogCategoriesParam): Promise<BlogCategory[]> {
    if (param?.onlyActive) {
      return this.blogCategoryRepository.findActive();
    }
    return this.blogCategoryRepository.findAll();
  }
}
