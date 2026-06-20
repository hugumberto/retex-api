import { EntitySchema } from 'typeorm';
import {
  BlogCategory,
  BlogCategoryStatus,
} from '../../../../domain/blog-post/blog-category.entity';
import { BaseTimestampColumns } from '../abstraction/timestamp';

export const blogCategorySchema = new EntitySchema<BlogCategory>({
  name: 'blog_category',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    title: {
      type: 'varchar',
      nullable: false,
      length: 255,
      name: 'title',
    },
    slug: {
      type: 'varchar',
      nullable: false,
      length: 255,
      name: 'slug',
    },
    status: {
      type: 'enum',
      enum: BlogCategoryStatus,
      nullable: false,
      name: 'status',
      default: BlogCategoryStatus.ACTIVE,
    },
    ...BaseTimestampColumns,
  },
  relations: {
    posts: {
      type: 'many-to-many',
      target: 'blog_post',
      inverseSide: 'categories',
    },
  },
  indices: [
    {
      // Unicidade só entre categorias vivas: permite recriar um slug depois de
      // um soft-delete (senão a categoria apagada bloqueava o slug para sempre).
      name: 'IDX_BLOG_CATEGORY_SLUG',
      unique: true,
      columns: ['slug'],
      where: 'deleted_at IS NULL',
    },
  ],
});
