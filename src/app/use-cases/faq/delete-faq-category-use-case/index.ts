import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { FaqCategory } from '../../../../domain/faq/faq-category.entity';
import { IFaqCategoryRepository } from '../../../../domain/faq/faq-category.repository';
import { FaqItem } from '../../../../domain/faq/faq-item.entity';
import { IFaqItemRepository } from '../../../../domain/faq/faq-item.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

@Injectable()
export class DeleteFaqCategoryUseCase implements IUseCase<{ id: string }, void> {
  constructor(
    @Inject(DOMAIN_TOKENS.FAQ_CATEGORY_REPOSITORY)
    private readonly faqCategoryRepository: IFaqCategoryRepository,
    @Inject(DOMAIN_TOKENS.FAQ_ITEM_REPOSITORY)
    private readonly faqItemRepository: IFaqItemRepository,
  ) {}

  async call({ id }: { id: string }): Promise<void> {
    const category = await this.faqCategoryRepository.findOne({ id } as Partial<FaqCategory>);
    if (!category) throw new NotFoundException('Categoria FAQ não encontrada');
    const items = await this.faqItemRepository.findByCategory(id);
    for (const item of items) {
      await this.faqItemRepository.delete({ id: item.id } as Partial<FaqItem>);
    }
    await this.faqCategoryRepository.delete({ id } as Partial<FaqCategory>);
  }
}
