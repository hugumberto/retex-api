import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ILocalStorageService } from '../../../../app/services/local-storage/local-storage.service';
import { SERVICE_TOKENS } from '../../../../app/services/tokens';
import { FaqItem } from '../../../../domain/faq/faq-item.entity';
import { IFaqItemRepository } from '../../../../domain/faq/faq-item.repository';
import { BaseRepository } from '../abstraction/base.repository';
import { faqItemSchema } from './faq-item.schema';

@Injectable()
export class FaqItemRepository
  extends BaseRepository<FaqItem>
  implements IFaqItemRepository {
  constructor(
    @InjectRepository(faqItemSchema)
    faqItemRepository: Repository<FaqItem>,
    @Inject(SERVICE_TOKENS.LOCAL_STORAGE_SERVICE)
    localStorageService: ILocalStorageService,
  ) {
    super(faqItemRepository, localStorageService);
  }

  async findByCategory(categoryId: string): Promise<FaqItem[]> {
    const repository = await this.getRepository();
    return repository.find({
      where: { categoryId },
      order: { position: 'ASC', createdAt: 'ASC' },
    });
  }

  async nextPosition(categoryId: string): Promise<number> {
    const repository = await this.getRepository();
    const [row] = await repository.manager.query(
      `SELECT COALESCE(MAX(position) + 1, 0) AS next FROM faq_item WHERE category_id = $1 AND deleted_at IS NULL`,
      [categoryId],
    );
    return Number(row?.next ?? 0);
  }

  async reorder(categoryId: string, ids: string[]): Promise<void> {
    const repository = await this.getRepository();
    await repository.manager.query(
      `UPDATE faq_item i SET position = o.ord - 1, updated_at = now()
         FROM unnest($2::uuid[]) WITH ORDINALITY AS o(id, ord)
        WHERE i.id = o.id AND i.category_id = $1`,
      [categoryId, ids],
    );
  }
}
