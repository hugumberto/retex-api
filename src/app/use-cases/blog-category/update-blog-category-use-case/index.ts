import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BlogCategory,
  BlogCategoryStatus,
} from '../../../../domain/blog-post/blog-category.entity';
import { IBlogCategoryRepository } from '../../../../domain/blog-post/blog-category.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { slugify } from '../slugify';

interface UpdateBlogCategoryParam {
  id: string;
  title?: string;
  status?: BlogCategoryStatus;
}

@Injectable()
export class UpdateBlogCategoryUseCase
  implements IUseCase<UpdateBlogCategoryParam, BlogCategory> {
  constructor(
    @Inject(DOMAIN_TOKENS.BLOG_CATEGORY_REPOSITORY)
    private readonly blogCategoryRepository: IBlogCategoryRepository,
  ) {}

  async call({ id, title, status }: UpdateBlogCategoryParam): Promise<BlogCategory> {
    const existing = await this.blogCategoryRepository.findOne({
      id,
    } as Partial<BlogCategory>);
    if (!existing) throw new NotFoundException('Categoria não encontrada');

    const data: Partial<BlogCategory> = {};

    if (title !== undefined) {
      const slug = slugify(title);
      const sameSlug = await this.blogCategoryRepository.findBySlug(slug);
      if (sameSlug && sameSlug.id !== id) {
        throw new ConflictException('Já existe uma categoria com este nome');
      }
      data.title = title;
      data.slug = slug;
    }

    if (status !== undefined) {
      data.status = status;
    }

    const [updated] = await this.blogCategoryRepository.update(
      { id } as Partial<BlogCategory>,
      data,
    );
    return updated;
  }
}
