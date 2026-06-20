import { Inject, Injectable } from '@nestjs/common';
import { FaqCategory, FaqStatus } from '../../../../domain/faq/faq-category.entity';
import { IFaqCategoryRepository } from '../../../../domain/faq/faq-category.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

interface CreateFaqCategoryParam {
  title: string;
  description: string;
  status?: FaqStatus;
}

@Injectable()
export class CreateFaqCategoryUseCase implements IUseCase<CreateFaqCategoryParam, FaqCategory> {
  constructor(
    @Inject(DOMAIN_TOKENS.FAQ_CATEGORY_REPOSITORY)
    private readonly faqCategoryRepository: IFaqCategoryRepository,
  ) {}

  async call(param: CreateFaqCategoryParam): Promise<FaqCategory> {
    return this.faqCategoryRepository.create({
      title: param.title,
      description: param.description,
      status: param.status ?? FaqStatus.ACTIVE,
    });
  }
}
