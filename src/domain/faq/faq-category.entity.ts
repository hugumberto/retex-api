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
  items?: FaqItem[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
