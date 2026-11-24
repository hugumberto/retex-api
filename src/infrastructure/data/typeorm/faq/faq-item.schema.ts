import { EntitySchema } from 'typeorm';
import { FaqItem } from '../../../../domain/faq/faq-item.entity';
import { BaseTimestampColumns } from '../abstraction/timestamp';

export const faqItemSchema = new EntitySchema<FaqItem>({
  name: 'faq_item',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    categoryId: {
      type: 'uuid',
      nullable: false,
      name: 'category_id',
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
    visible: {
      type: 'boolean',
      nullable: false,
      default: true,
    },
    position: {
      type: 'integer',
      nullable: false,
      default: 0,
    },
    ...BaseTimestampColumns,
  },
  relations: {
    category: {
      type: 'many-to-one',
      target: 'faq_category',
      joinColumn: { name: 'category_id' },
      inverseSide: 'items',
      onDelete: 'CASCADE',
    },
  },
});
