import { FaqItem } from './faq-item.entity';

export enum FaqStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface FaqCategory {
  id: string;
  title: string;
  description: string;
  status: FaqStatus;
  // Ordem dos grupos no site (0, 1, 2…).
  position: number;
  items?: FaqItem[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
