import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { IFaqCategoryRepository } from '../../../../domain/faq/faq-category.repository';
import { IFaqItemRepository } from '../../../../domain/faq/faq-item.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

/**
 * Ordem por arrastar: sem `categoryId` ordena os grupos; com `categoryId`
 * ordena as perguntas desse grupo. Os ids têm de ser exatamente os que lá estão.
 */
@Injectable()
export class ReorderFaqUseCase implements IUseCase<{ categoryId?: string; ids: string[] }, void> {
  constructor(
    @Inject(DOMAIN_TOKENS.FAQ_CATEGORY_REPOSITORY)
    private readonly faqCategoryRepository: IFaqCategoryRepository,
    @Inject(DOMAIN_TOKENS.FAQ_ITEM_REPOSITORY)
    private readonly faqItemRepository: IFaqItemRepository,
  ) {}

  async call({ categoryId, ids }: { categoryId?: string; ids: string[] }): Promise<void> {
    const unique = [...new Set(ids)];
    const current = categoryId
      ? await this.faqItemRepository.findByCategory(categoryId)
      : await this.faqCategoryRepository.findAllWithItems();
    if (unique.length !== current.length || unique.some((id) => !current.some((c) => c.id === id))) {
      throw new BadRequestException('errors.faq.invalidOrder');
    }
    if (categoryId) await this.faqItemRepository.reorder(categoryId, unique);
    else await this.faqCategoryRepository.reorder(unique);
  }
}
