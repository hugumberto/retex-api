import { EntitySchema } from 'typeorm';
import { BlogPostHighlight } from '../../../../domain/blog-post/blog-post-highlight.enum';
import { BlogPostStatus } from '../../../../domain/blog-post/blog-post-status.enum';
import { BlogPost } from '../../../../domain/blog-post/blog-post.entity';
import { BaseTimestampColumns } from '../abstraction/timestamp';

export const blogPostSchema = new EntitySchema<BlogPost>({
  name: 'blog_post',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    body: {
      type: 'text',
      nullable: false,
      name: 'body',
    },
    slug: {
      type: 'varchar',
      nullable: false,
      length: 255,
      name: 'slug',
      unique: true,
    },
    title: {
      type: 'varchar',
      nullable: false,
      length: 255,
      name: 'title',
    },
    hero: {
      type: 'text',
      nullable: false,
      name: 'hero',
    },
    status: {
      type: 'enum',
      enum: BlogPostStatus,
      nullable: false,
      name: 'status',
      default: BlogPostStatus.DRAFT,
    },
    highlight: {
      type: 'int',
      nullable: false,
      name: 'highlight',
      default: BlogPostHighlight.NONE,
    },
    tags: {
      type: 'json',
      nullable: false,
      name: 'tags',
      default: [],
    },
    publishDate: {
      type: 'timestamp with time zone',
      nullable: true,
      name: 'publish_date',
    },
    ...BaseTimestampColumns,
  },
  indices: [
    {
      name: 'IDX_BLOG_POST_SLUG',
      unique: true,
      columns: ['slug'],
    },
    {
      name: 'IDX_BLOG_POST_STATUS',
      columns: ['status'],
    },
    {
      name: 'IDX_BLOG_POST_HIGHLIGHT',
      columns: ['highlight'],
    },
    {
      name: 'IDX_BLOG_POST_PUBLISH_DATE',
      columns: ['publishDate'],
    },
  ],
});
