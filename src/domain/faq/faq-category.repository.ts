import { IRepository } from '../interfaces/repository.interface';
import { FaqCategory } from './faq-category.entity';

export interface IFaqCategoryRepository extends IRepository<FaqCategory> {
  findAllWithItems(): Promise<FaqCategory[]>;
  findActiveWithItems(): Promise<FaqCategory[]>;
}
