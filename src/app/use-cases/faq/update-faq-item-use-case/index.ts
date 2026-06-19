import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { FaqItem } from '../../../../domain/faq/faq-item.entity';
import { IFaqItemRepository } from '../../../../domain/faq/faq-item.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

interface UpdateFaqItemParam {
  id: string;
  title?: string;
  description?: string;
}

@Injectable()
export class UpdateFaqItemUseCase implements IUseCase<UpdateFaqItemParam, FaqItem> {
  constructor(
    @Inject(DOMAIN_TOKENS.FAQ_ITEM_REPOSITORY)
    private readonly faqItemRepository: IFaqItemRepository,
  ) {}

  async call({ id, ...data }: UpdateFaqItemParam): Promise<FaqItem> {
    const existing = await this.faqItemRepository.findOne({ id } as Partial<FaqItem>);
    if (!existing) throw new NotFoundException('Item FAQ não encontrado');
    const [updated] = await this.faqItemRepository.update({ id } as Partial<FaqItem>, data);
    return updated;
  }
}
