import { Test, TestingModule } from '@nestjs/testing';
import { BindItemsStorageUnitsUseCase } from '../../app/use-cases/item/bind-items-storage-units-use-case';
import { CreateItemUseCase } from '../../app/use-cases/item/create-item-use-case';
import { DeleteItemUseCase } from '../../app/use-cases/item/delete-item-use-case';
import { ItemController } from './item.controller';

describe('ItemController', () => {
  let controller: ItemController;
  let createItemUseCase: CreateItemUseCase;
  let bindItemsStorageUnitsUseCase: BindItemsStorageUnitsUseCase;
  let deleteItemUseCase: DeleteItemUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItemController],
      providers: [
        {
          provide: CreateItemUseCase,
          useValue: { call: jest.fn() },
        },
        {
          provide: BindItemsStorageUnitsUseCase,
          useValue: { call: jest.fn() },
        },
        {
          provide: DeleteItemUseCase,
          useValue: { call: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<ItemController>(ItemController);
    createItemUseCase = module.get<CreateItemUseCase>(CreateItemUseCase);
    bindItemsStorageUnitsUseCase = module.get<BindItemsStorageUnitsUseCase>(
      BindItemsStorageUnitsUseCase,
    );
    deleteItemUseCase = module.get<DeleteItemUseCase>(DeleteItemUseCase);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createItem', () => {
    it('should call CreateItemUseCase with correct body', async () => {
      const body = { packageId: 'package-id' };
      const expectedResult = { id: 'item-id' };

      jest
        .spyOn(createItemUseCase, 'call')
        .mockResolvedValue(expectedResult as any);

      const result = await controller.createItem(body as any);

      expect(createItemUseCase.call).toHaveBeenCalledWith(body);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('bindItemsStorageUnits', () => {
    it('should call BindItemsStorageUnitsUseCase with correct body', async () => {
      const body = { itemIds: ['item-1'], storageUnitIds: ['storage-1'] };
      const expectedResult = { affectedItems: 1 };

      jest
        .spyOn(bindItemsStorageUnitsUseCase, 'call')
        .mockResolvedValue(expectedResult as any);

      const result = await controller.bindItemsStorageUnits(body as any);

      expect(bindItemsStorageUnitsUseCase.call).toHaveBeenCalledWith(body);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('deleteItem', () => {
    it('should call DeleteItemUseCase with item id', async () => {
      const expectedResult = { id: 'item-id' };

      jest
        .spyOn(deleteItemUseCase, 'call')
        .mockResolvedValue(expectedResult as any);

      const result = await controller.deleteItem('item-id');

      expect(deleteItemUseCase.call).toHaveBeenCalledWith('item-id');
      expect(result).toEqual(expectedResult);
    });
  });
});
