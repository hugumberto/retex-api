import { Inject, Injectable } from '@nestjs/common';
import { FaqCategory } from '../../../../domain/faq/faq-category.entity';
import { IFaqCategoryRepository } from '../../../../domain/faq/faq-category.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

@Injectable()
export class GetPublicFaqUseCase implements IUseCase<void, Array<{ category: FaqCategory }>> {
  constructor(
    @Inject(DOMAIN_TOKENS.FAQ_CATEGORY_REPOSITORY)
    private readonly faqCategoryRepository: IFaqCategoryRepository,
  ) {}

  async call(): Promise<Array<{ category: FaqCategory }>> {
    const categories = await this.faqCategoryRepository.findActiveWithItems();
    return categories.map((category) => ({ category }));
  }
}
