import { Test } from '@nestjs/testing';
import {
  CreateBrandUseCase,
  DeleteBrandUseCase,
  GetAllBrandsUseCase,
  GetBrandByIdUseCase,
  UpdateBrandUseCase,
} from '../../app/use-cases/brand';
import { BrandController } from './brand.controller';

describe('BrandController', () => {
  let controller: BrandController;
  const create = { call: jest.fn() };
  const getById = { call: jest.fn() };
  const getAll = { call: jest.fn() };
  const update = { call: jest.fn() };
  const del = { call: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      controllers: [BrandController],
      providers: [
        { provide: CreateBrandUseCase, useValue: create },
        { provide: GetBrandByIdUseCase, useValue: getById },
        { provide: GetAllBrandsUseCase, useValue: getAll },
        { provide: UpdateBrandUseCase, useValue: update },
        { provide: DeleteBrandUseCase, useValue: del },
      ],
    }).compile();
    controller = module.get(BrandController);
  });

  it('delegates create', async () => {
    await controller.create({ name: 'Nike' } as any);
    expect(create.call).toHaveBeenCalledWith({ name: 'Nike' });
  });

  it('delegates update with id + data', async () => {
    await controller.update('b1', { name: 'Adidas' } as any);
    expect(update.call).toHaveBeenCalledWith({ id: 'b1', data: { name: 'Adidas' } });
  });

  it('delegates delete with id', async () => {
    await controller.remove('b1');
    expect(del.call).toHaveBeenCalledWith('b1');
  });
});
