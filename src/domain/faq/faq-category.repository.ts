import { IRepository } from '../interfaces/repository.interface';
import { FaqCategory } from './faq-category.entity';

export interface IFaqCategoryRepository extends IRepository<FaqCategory> {
  findAllWithItems(): Promise<FaqCategory[]>;
  findActiveWithItems(): Promise<FaqCategory[]>;
  nextPosition(): Promise<number>;
  /** Grava a ordem dos grupos: o primeiro id fica com posição 0. */
  reorder(ids: string[]): Promise<void>;
}
