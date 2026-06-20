import { EntitySchema } from 'typeorm';
import { FaqCategory, FaqStatus } from '../../../../domain/faq/faq-category.entity';
import { BaseTimestampColumns } from '../abstraction/timestamp';

export const faqCategorySchema = new EntitySchema<FaqCategory>({
  name: 'faq_category',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    title: {
      type: 'varchar',
      nullable: false,
      length: 255,
    },
    description: {
      type: 'text',
      nullable: false,
    },
    status: {
      type: 'enum',
      enum: FaqStatus,
      nullable: false,
      default: FaqStatus.ACTIVE,
    },
    ...BaseTimestampColumns,
  },
  relations: {
    items: {
      type: 'one-to-many',
      target: 'faq_item',
      inverseSide: 'category',
      cascade: true,
    },
  },
});
