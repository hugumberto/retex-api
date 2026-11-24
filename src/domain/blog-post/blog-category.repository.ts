import { IRepository } from '../interfaces/repository.interface';
import { BlogCategory } from './blog-category.entity';

export interface IBlogCategoryRepository extends IRepository<BlogCategory> {
  findAll(): Promise<BlogCategory[]>;
  findActive(): Promise<BlogCategory[]>;
  findByIds(ids: string[]): Promise<BlogCategory[]>;
  findBySlug(slug: string): Promise<BlogCategory>;
  /** Artigos (não apagados) na categoria. */
  countPosts(id: string): Promise<number>;
  nextPosition(): Promise<number>;
  /** Grava a ordem: o primeiro id fica com posição 0. */
  reorder(ids: string[]): Promise<void>;
}
