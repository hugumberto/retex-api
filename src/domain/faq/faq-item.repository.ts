import { IRepository } from '../interfaces/repository.interface';
import { FaqItem } from './faq-item.entity';

export interface IFaqItemRepository extends IRepository<FaqItem> {
  findByCategory(categoryId: string): Promise<FaqItem[]>;
}
