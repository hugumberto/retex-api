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
      order: { createdAt: 'ASC' },
    });
  }
}
