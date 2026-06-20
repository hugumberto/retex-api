import { IRepository } from '../interfaces/repository.interface';
import { BlogCategory } from './blog-category.entity';

export interface IBlogCategoryRepository extends IRepository<BlogCategory> {
  findAll(): Promise<BlogCategory[]>;
  findActive(): Promise<BlogCategory[]>;
  findByIds(ids: string[]): Promise<BlogCategory[]>;
  findBySlug(slug: string): Promise<BlogCategory>;
}
