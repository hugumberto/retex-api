import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { FaqCategory, FaqStatus } from '../../../../domain/faq/faq-category.entity';
import { IFaqCategoryRepository } from '../../../../domain/faq/faq-category.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

interface UpdateFaqCategoryParam {
  id: string;
  title?: string;
  description?: string;
  status?: FaqStatus;
}

@Injectable()
export class UpdateFaqCategoryUseCase implements IUseCase<UpdateFaqCategoryParam, FaqCategory> {
  constructor(
    @Inject(DOMAIN_TOKENS.FAQ_CATEGORY_REPOSITORY)
    private readonly faqCategoryRepository: IFaqCategoryRepository,
  ) {}

  async call({ id, ...data }: UpdateFaqCategoryParam): Promise<FaqCategory> {
    const existing = await this.faqCategoryRepository.findOne({ id } as Partial<FaqCategory>);
    if (!existing) throw new NotFoundException('Categoria FAQ não encontrada');
    const [updated] = await this.faqCategoryRepository.update({ id } as Partial<FaqCategory>, data);
    return updated;
  }
}
