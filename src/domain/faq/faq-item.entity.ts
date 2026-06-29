import { FaqCategory } from './faq-category.entity';

export interface FaqItem {
  id: string;
  categoryId: string;
  category?: FaqCategory;
  title: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
