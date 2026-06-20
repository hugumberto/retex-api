import { Entity } from '../interfaces/entity.interface';
import { BlogPost } from './blog-post.entity';

export enum BlogCategoryStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface BlogCategory extends Entity {
  title: string;
  slug: string;
  status: BlogCategoryStatus;
  posts?: BlogPost[];
}
