import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { FaqCategory } from '../../../../domain/faq/faq-category.entity';
import { IFaqCategoryRepository } from '../../../../domain/faq/faq-category.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { UpdateFaqCategoryUseCase } from '.';

describe('UpdateFaqCategoryUseCase', () => {
  const repo = mock<IFaqCategoryRepository>();
  let useCase: UpdateFaqCategoryUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        UpdateFaqCategoryUseCase,
        { provide: DOMAIN_TOKENS.FAQ_CATEGORY_REPOSITORY, useValue: repo },
      ],
    }).compile();
    useCase = module.get(UpdateFaqCategoryUseCase);
  });

  it('throws when the category does not exist', async () => {
    repo.findOne.mockResolvedValue(undefined);
    await expect(useCase.call({ id: 'c1' } as any)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('updates an existing category', async () => {
    repo.findOne.mockResolvedValue({ id: 'c1' } as FaqCategory);
    repo.update.mockResolvedValue([{ id: 'c1' } as FaqCategory]);
    await useCase.call({ id: 'c1', title: 'New' } as any);
    expect(repo.update).toHaveBeenCalled();
  });
});
