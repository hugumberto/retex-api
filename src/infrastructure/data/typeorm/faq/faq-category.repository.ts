import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ILocalStorageService } from '../../../../app/services/local-storage/local-storage.service';
import { SERVICE_TOKENS } from '../../../../app/services/tokens';
import { FaqCategory, FaqStatus } from '../../../../domain/faq/faq-category.entity';
import { IFaqCategoryRepository } from '../../../../domain/faq/faq-category.repository';
import { BaseRepository } from '../abstraction/base.repository';
import { faqCategorySchema } from './faq-category.schema';

@Injectable()
export class FaqCategoryRepository
  extends BaseRepository<FaqCategory>
  implements IFaqCategoryRepository {
  constructor(
    @InjectRepository(faqCategorySchema)
    faqCategoryRepository: Repository<FaqCategory>,
    @Inject(SERVICE_TOKENS.LOCAL_STORAGE_SERVICE)
    localStorageService: ILocalStorageService,
  ) {
    super(faqCategoryRepository, localStorageService);
  }

  async findAllWithItems(): Promise<FaqCategory[]> {
    const repository = await this.getRepository();
    return repository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.items', 'items')
      .orderBy('category.position', 'ASC')
      .addOrderBy('category.createdAt', 'DESC')
      // Ordem escolhida no backoffice; empate pela ordem de criação.
      .addOrderBy('items.position', 'ASC')
      .addOrderBy('items.createdAt', 'ASC')
      .getMany();
  }

  async findActiveWithItems(): Promise<FaqCategory[]> {
    const repository = await this.getRepository();
    return repository
      .createQueryBuilder('category')
      // Perguntas escondidas não vão para o site.
      .leftJoinAndSelect('category.items', 'items', 'items.visible = true')
      .where('category.status = :status', { status: FaqStatus.ACTIVE })
      .orderBy('category.position', 'ASC')
      .addOrderBy('category.createdAt', 'DESC')
      // Ordem escolhida no backoffice; empate pela ordem de criação.
      .addOrderBy('items.position', 'ASC')
      .addOrderBy('items.createdAt', 'ASC')
      .getMany();
  }

  async nextPosition(): Promise<number> {
    const repository = await this.getRepository();
    const [row] = await repository.manager.query(
      `SELECT COALESCE(MAX(position) + 1, 0) AS next FROM faq_category WHERE deleted_at IS NULL`,
    );
    return Number(row?.next ?? 0);
  }

  async reorder(ids: string[]): Promise<void> {
    const repository = await this.getRepository();
    await repository.manager.query(
      `UPDATE faq_category c SET position = o.ord - 1, updated_at = now()
         FROM unnest($1::uuid[]) WITH ORDINALITY AS o(id, ord)
        WHERE c.id = o.id`,
      [ids],
    );
  }
}
