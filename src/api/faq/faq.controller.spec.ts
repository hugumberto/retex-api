import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { CreateFaqCategoryUseCase } from '../../app/use-cases/faq/create-faq-category-use-case';
import { CreateFaqItemUseCase } from '../../app/use-cases/faq/create-faq-item-use-case';
import { DeleteFaqCategoryUseCase } from '../../app/use-cases/faq/delete-faq-category-use-case';
import { DeleteFaqItemUseCase } from '../../app/use-cases/faq/delete-faq-item-use-case';
import { GetAllFaqCategoriesUseCase } from '../../app/use-cases/faq/get-all-faq-categories-use-case';
import { GetPublicFaqUseCase } from '../../app/use-cases/faq/get-public-faq-use-case';
import { UpdateFaqCategoryUseCase } from '../../app/use-cases/faq/update-faq-category-use-case';
import { UpdateFaqItemUseCase } from '../../app/use-cases/faq/update-faq-item-use-case';
import { FaqController } from './faq.controller';

describe('FaqController', () => {
  let controller: FaqController;
  const m = {
    getPublic: { call: jest.fn() },
    getAll: { call: jest.fn() },
    createCat: { call: jest.fn() },
    updateCat: { call: jest.fn() },
    deleteCat: { call: jest.fn() },
    createItem: { call: jest.fn() },
    updateItem: { call: jest.fn() },
    deleteItem: { call: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      controllers: [FaqController],
      providers: [
        { provide: GetPublicFaqUseCase, useValue: m.getPublic },
        { provide: GetAllFaqCategoriesUseCase, useValue: m.getAll },
        { provide: CreateFaqCategoryUseCase, useValue: m.createCat },
        { provide: UpdateFaqCategoryUseCase, useValue: m.updateCat },
        { provide: DeleteFaqCategoryUseCase, useValue: m.deleteCat },
        { provide: CreateFaqItemUseCase, useValue: m.createItem },
        { provide: UpdateFaqItemUseCase, useValue: m.updateItem },
        { provide: DeleteFaqItemUseCase, useValue: m.deleteItem },
        { provide: JwtService, useValue: {} },
      ],
    }).compile();
    controller = module.get(FaqController);
  });

  it('delegates createCategory', () => {
    controller.createCategory({ title: 'T', description: 'D' } as any);
    expect(m.createCat.call).toHaveBeenCalledWith({ title: 'T', description: 'D' });
  });

  it('delegates deleteCategory by id', () => {
    controller.deleteCategory('c1');
    expect(m.deleteCat.call).toHaveBeenCalledWith({ id: 'c1' });
  });

  it('attaches the categoryId when creating an item', () => {
    controller.createItem('c1', { title: 'Q', description: 'A' } as any);
    expect(m.createItem.call).toHaveBeenCalledWith({
      title: 'Q',
      description: 'A',
      categoryId: 'c1',
    });
  });
});
