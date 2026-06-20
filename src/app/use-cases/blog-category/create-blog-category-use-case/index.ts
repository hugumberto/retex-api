import { ConflictException, Inject, Injectable } from '@nestjs/common';
import {
  BlogCategory,
  BlogCategoryStatus,
} from '../../../../domain/blog-post/blog-category.entity';
import { IBlogCategoryRepository } from '../../../../domain/blog-post/blog-category.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { slugify } from '../slugify';

interface CreateBlogCategoryParam {
  title: string;
  status?: BlogCategoryStatus;
}

@Injectable()
export class CreateBlogCategoryUseCase
  implements IUseCase<CreateBlogCategoryParam, BlogCategory> {
  constructor(
    @Inject(DOMAIN_TOKENS.BLOG_CATEGORY_REPOSITORY)
    private readonly blogCategoryRepository: IBlogCategoryRepository,
  ) {}

  async call(param: CreateBlogCategoryParam): Promise<BlogCategory> {
    const slug = slugify(param.title);

    const existing = await this.blogCategoryRepository.findBySlug(slug);
    if (existing) {
      throw new ConflictException('Já existe uma categoria com este nome');
    }

    return this.blogCategoryRepository.create({
      title: param.title,
      slug,
      status: param.status ?? BlogCategoryStatus.ACTIVE,
    });
  }
}
