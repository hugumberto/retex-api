import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { IBlogCategoryRepository } from '../../../../domain/blog-post/blog-category.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

/** Ordem das categorias no site, pela ordem dos ids recebidos (arrastar na lista). */
@Injectable()
export class ReorderBlogCategoriesUseCase implements IUseCase<{ ids: string[] }, void> {
  constructor(
    @Inject(DOMAIN_TOKENS.BLOG_CATEGORY_REPOSITORY)
    private readonly blogCategoryRepository: IBlogCategoryRepository,
  ) {}

  async call({ ids }: { ids: string[] }): Promise<void> {
    const unique = [...new Set(ids)];
    const all = await this.blogCategoryRepository.findAll();
    if (unique.length !== all.length || unique.some((id) => !all.some((c) => c.id === id))) {
      throw new BadRequestException('errors.category.invalidOrder');
    }
    await this.blogCategoryRepository.reorder(unique);
  }
}
