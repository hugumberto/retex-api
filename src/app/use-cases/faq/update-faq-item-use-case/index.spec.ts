import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { FaqCategory } from '../../../../domain/faq/faq-category.entity';
import { IFaqCategoryRepository } from '../../../../domain/faq/faq-category.repository';
import { FaqItem } from '../../../../domain/faq/faq-item.entity';
import { IFaqItemRepository } from '../../../../domain/faq/faq-item.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { UpdateFaqItemUseCase } from '.';

describe('UpdateFaqItemUseCase', () => {
  const repo = mock<IFaqItemRepository>();
  const categories = mock<IFaqCategoryRepository>();
  let useCase: UpdateFaqItemUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        UpdateFaqItemUseCase,
        { provide: DOMAIN_TOKENS.FAQ_ITEM_REPOSITORY, useValue: repo },
        { provide: DOMAIN_TOKENS.FAQ_CATEGORY_REPOSITORY, useValue: categories },
      ],
    }).compile();
    useCase = module.get(UpdateFaqItemUseCase);
  });

  it('throws when the item does not exist', async () => {
    repo.findOne.mockResolvedValue(undefined);
    await expect(useCase.call({ id: 'it1' } as any)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('updates an existing item', async () => {
    repo.findOne.mockResolvedValue({ id: 'it1' } as FaqItem);
    repo.update.mockResolvedValue([{ id: 'it1' } as FaqItem]);
    await useCase.call({ id: 'it1', title: 'New' } as any);
    expect(repo.update).toHaveBeenCalled();
  });

  it('ao mudar de grupo, vai para o fim do novo grupo', async () => {
    repo.findOne.mockResolvedValue({ id: 'it1', categoryId: 'c1' } as FaqItem);
    categories.findOne.mockResolvedValue({ id: 'c2' } as FaqCategory);
    repo.nextPosition.mockResolvedValue(7);
    repo.update.mockResolvedValue([{ id: 'it1' } as FaqItem]);
    await useCase.call({ id: 'it1', categoryId: 'c2', visible: false });
    expect(repo.update).toHaveBeenCalledWith({ id: 'it1' }, { categoryId: 'c2', visible: false, position: 7 });
  });

  it('o mesmo grupo não mexe na ordem', async () => {
    repo.findOne.mockResolvedValue({ id: 'it1', categoryId: 'c1' } as FaqItem);
    repo.update.mockResolvedValue([{ id: 'it1' } as FaqItem]);
    await useCase.call({ id: 'it1', categoryId: 'c1', title: 'X' });
    expect(repo.update).toHaveBeenCalledWith({ id: 'it1' }, { title: 'X' });
  });
});
