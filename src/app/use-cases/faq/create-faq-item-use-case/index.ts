import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { FaqCategory } from '../../../../domain/faq/faq-category.entity';
import { IFaqCategoryRepository } from '../../../../domain/faq/faq-category.repository';
import { FaqItem } from '../../../../domain/faq/faq-item.entity';
import { IFaqItemRepository } from '../../../../domain/faq/faq-item.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

interface CreateFaqItemParam {
  categoryId: string;
  title: string;
  description: string;
}

@Injectable()
export class CreateFaqItemUseCase implements IUseCase<CreateFaqItemParam, FaqItem> {
  constructor(
    @Inject(DOMAIN_TOKENS.FAQ_CATEGORY_REPOSITORY)
    private readonly faqCategoryRepository: IFaqCategoryRepository,
    @Inject(DOMAIN_TOKENS.FAQ_ITEM_REPOSITORY)
    private readonly faqItemRepository: IFaqItemRepository,
  ) {}

  async call(param: CreateFaqItemParam): Promise<FaqItem> {
    const category = await this.faqCategoryRepository.findOne({ id: param.categoryId } as Partial<FaqCategory>);
    if (!category) throw new NotFoundException('Categoria FAQ não encontrada');
    return this.faqItemRepository.create({
      categoryId: param.categoryId,
      title: param.title,
      description: param.description,
    });
  }
}
