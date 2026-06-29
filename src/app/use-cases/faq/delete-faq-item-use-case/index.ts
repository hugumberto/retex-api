import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { FaqItem } from '../../../../domain/faq/faq-item.entity';
import { IFaqItemRepository } from '../../../../domain/faq/faq-item.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

@Injectable()
export class DeleteFaqItemUseCase implements IUseCase<{ id: string }, void> {
  constructor(
    @Inject(DOMAIN_TOKENS.FAQ_ITEM_REPOSITORY)
    private readonly faqItemRepository: IFaqItemRepository,
  ) {}

  async call({ id }: { id: string }): Promise<void> {
    const item = await this.faqItemRepository.findOne({ id } as Partial<FaqItem>);
    if (!item) throw new NotFoundException('Item FAQ não encontrado');
    await this.faqItemRepository.delete({ id } as Partial<FaqItem>);
  }
}
