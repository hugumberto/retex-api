import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BlogCategory } from '../../../../domain/blog-post/blog-category.entity';
import { IBlogCategoryRepository } from '../../../../domain/blog-post/blog-category.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

@Injectable()
export class DeleteBlogCategoryUseCase implements IUseCase<{ id: string }, void> {
  constructor(
    @Inject(DOMAIN_TOKENS.BLOG_CATEGORY_REPOSITORY)
    private readonly blogCategoryRepository: IBlogCategoryRepository,
  ) {}

  async call({ id }: { id: string }): Promise<void> {
    const existing = await this.blogCategoryRepository.findOne({
      id,
    } as Partial<BlogCategory>);
    if (!existing) throw new NotFoundException('Categoria não encontrada');
    // O vínculo na tabela blog_post_categories é removido em cascata (ON DELETE CASCADE).
    await this.blogCategoryRepository.delete({ id } as Partial<BlogCategory>);
  }
}
