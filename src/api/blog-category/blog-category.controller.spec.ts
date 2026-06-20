import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { CreateBlogCategoryUseCase } from '../../app/use-cases/blog-category/create-blog-category-use-case';
import { DeleteBlogCategoryUseCase } from '../../app/use-cases/blog-category/delete-blog-category-use-case';
import { GetAllBlogCategoriesUseCase } from '../../app/use-cases/blog-category/get-all-blog-categories-use-case';
import { UpdateBlogCategoryUseCase } from '../../app/use-cases/blog-category/update-blog-category-use-case';
import { BlogCategoryController } from './blog-category.controller';

describe('BlogCategoryController', () => {
  let controller: BlogCategoryController;
  const getAll = { call: jest.fn() };
  const create = { call: jest.fn() };
  const update = { call: jest.fn() };
  const del = { call: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      controllers: [BlogCategoryController],
      providers: [
        { provide: GetAllBlogCategoriesUseCase, useValue: getAll },
        { provide: CreateBlogCategoryUseCase, useValue: create },
        { provide: UpdateBlogCategoryUseCase, useValue: update },
        { provide: DeleteBlogCategoryUseCase, useValue: del },
        { provide: JwtService, useValue: {} },
      ],
    }).compile();
    controller = module.get(BlogCategoryController);
  });

  it('delegates create', () => {
    controller.create({ title: 'Moda' } as any);
    expect(create.call).toHaveBeenCalledWith({ title: 'Moda' });
  });

  it('delegates update with id + body', () => {
    controller.update('c1', { title: 'Nova' } as any);
    expect(update.call).toHaveBeenCalledWith({ id: 'c1', title: 'Nova' });
  });

  it('delegates delete by id', () => {
    controller.delete('c1');
    expect(del.call).toHaveBeenCalledWith({ id: 'c1' });
  });
});
