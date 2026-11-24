import { FaqCategory } from './faq-category.entity';

export interface FaqItem {
  id: string;
  categoryId: string;
  category?: FaqCategory;
  title: string;
  description: string;
  // Escondida = não aparece no site.
  visible: boolean;
  // Ordem dentro do grupo (0, 1, 2…).
  position: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
