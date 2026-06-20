import { Inject, Injectable } from '@nestjs/common';
import { FaqCategory } from '../../../../domain/faq/faq-category.entity';
import { IFaqCategoryRepository } from '../../../../domain/faq/faq-category.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

@Injectable()
export class GetAllFaqCategoriesUseCase implements IUseCase<void, FaqCategory[]> {
  constructor(
    @Inject(DOMAIN_TOKENS.FAQ_CATEGORY_REPOSITORY)
    private readonly faqCategoryRepository: IFaqCategoryRepository,
  ) {}

  async call(): Promise<FaqCategory[]> {
    return this.faqCategoryRepository.findAllWithItems();
  }
}
