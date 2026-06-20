import { Test } from '@nestjs/testing';
import {
  CreateStorageUnitUseCase,
  DeleteStorageUnitUseCase,
  GetAllStorageUnitsUseCase,
  GetStorageUnitByIdUseCase,
  UpdateStorageUnitUseCase,
} from '../../app/use-cases/storage-unit';
import { StorageUnitController } from './storage-unit.controller';

describe('StorageUnitController', () => {
  let controller: StorageUnitController;
  const create = { call: jest.fn() };
  const getById = { call: jest.fn() };
  const getAll = { call: jest.fn() };
  const update = { call: jest.fn() };
  const del = { call: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      controllers: [StorageUnitController],
      providers: [
        { provide: CreateStorageUnitUseCase, useValue: create },
        { provide: GetStorageUnitByIdUseCase, useValue: getById },
        { provide: GetAllStorageUnitsUseCase, useValue: getAll },
        { provide: UpdateStorageUnitUseCase, useValue: update },
        { provide: DeleteStorageUnitUseCase, useValue: del },
      ],
    }).compile();
    controller = module.get(StorageUnitController);
  });

  it('delegates create', async () => {
    await controller.create({ code: 'SU1' } as any);
    expect(create.call).toHaveBeenCalledWith({ code: 'SU1' });
  });

  it('delegates update with id + data', async () => {
    await controller.update('s1', { weight: 5 } as any);
    expect(update.call).toHaveBeenCalledWith({ id: 's1', data: { weight: 5 } });
  });

  it('delegates delete with id', async () => {
    await controller.remove('s1');
    expect(del.call).toHaveBeenCalledWith('s1');
  });
});
