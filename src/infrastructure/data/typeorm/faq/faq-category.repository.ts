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
      .orderBy('category.createdAt', 'DESC')
      .getMany();
  }

  async findActiveWithItems(): Promise<FaqCategory[]> {
    const repository = await this.getRepository();
    return repository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.items', 'items')
      .where('category.status = :status', { status: FaqStatus.ACTIVE })
      .orderBy('category.createdAt', 'DESC')
      .getMany();
  }
}
