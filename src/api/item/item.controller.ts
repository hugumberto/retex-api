import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { BindItemsStorageUnitsUseCase } from '../../app/use-cases/item/bind-items-storage-units-use-case';
import { BindItemsStorageUnitsDto } from '../../app/use-cases/item/bind-items-storage-units-use-case/bind-items-storage-units.dto';
import { CreateItemUseCase } from '../../app/use-cases/item/create-item-use-case';
import { CreateItemDto } from '../../app/use-cases/item/create-item-use-case/create-item.dto';
import { DeleteItemUseCase } from '../../app/use-cases/item/delete-item-use-case';

@Controller('items')
export class ItemController {
  constructor(
    private readonly createItemUseCase: CreateItemUseCase,
    private readonly bindItemsStorageUnitsUseCase: BindItemsStorageUnitsUseCase,
    private readonly deleteItemUseCase: DeleteItemUseCase,
  ) {}

  @Post()
  createItem(@Body() body: CreateItemDto) {
    return this.createItemUseCase.call(body);
  }

  @Post('bind-storage-units')
  bindItemsStorageUnits(@Body() body: BindItemsStorageUnitsDto) {
    return this.bindItemsStorageUnitsUseCase.call(body);
  }

  @Delete(':id')
  deleteItem(@Param('id') id: string) {
    return this.deleteItemUseCase.call(id);
  }
}
