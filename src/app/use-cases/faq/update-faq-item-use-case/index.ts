import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { FaqCategory } from '../../../../domain/faq/faq-category.entity';
import { IFaqCategoryRepository } from '../../../../domain/faq/faq-category.repository';
import { FaqItem } from '../../../../domain/faq/faq-item.entity';
import { IFaqItemRepository } from '../../../../domain/faq/faq-item.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

interface UpdateFaqItemParam {
  id: string;
  title?: string;
  description?: string;
  visible?: boolean;
  // Mudar de grupo: a pergunta vai para o fim do novo grupo.
  categoryId?: string;
}

@Injectable()
export class UpdateFaqItemUseCase implements IUseCase<UpdateFaqItemParam, FaqItem> {
  constructor(
    @Inject(DOMAIN_TOKENS.FAQ_ITEM_REPOSITORY)
    private readonly faqItemRepository: IFaqItemRepository,
    @Inject(DOMAIN_TOKENS.FAQ_CATEGORY_REPOSITORY)
    private readonly faqCategoryRepository: IFaqCategoryRepository,
  ) {}

  async call({ id, ...data }: UpdateFaqItemParam): Promise<FaqItem> {
    const existing = await this.faqItemRepository.findOne({ id } as Partial<FaqItem>);
    if (!existing) throw new NotFoundException('errors.faq.itemNotFound');
    const changes: Partial<FaqItem> = { ...data };
    if (data.categoryId && data.categoryId !== existing.categoryId) {
      const category = await this.faqCategoryRepository.findOne({ id: data.categoryId } as Partial<FaqCategory>);
      if (!category) throw new NotFoundException('errors.faq.categoryNotFound');
      changes.position = await this.faqItemRepository.nextPosition(data.categoryId);
    } else {
      delete changes.categoryId;
    }
    const [updated] = await this.faqItemRepository.update({ id } as Partial<FaqItem>, changes);
    return updated;
  }
}
