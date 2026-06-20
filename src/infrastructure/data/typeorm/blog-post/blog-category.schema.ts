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
      unique: true,
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
      name: 'IDX_BLOG_CATEGORY_SLUG',
      unique: true,
      columns: ['slug'],
    },
  ],
});
