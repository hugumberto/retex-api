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
  // Aparece no topo da página da categoria.
  description?: string | null;
  // Ordem no site (0, 1, 2…).
  position: number;
  // Artigos na categoria (só nas listagens do backoffice).
  postsCount?: number;
  posts?: BlogPost[];
}
