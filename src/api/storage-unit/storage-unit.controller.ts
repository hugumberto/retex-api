import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import {
  CreateStorageUnitDto,
  CreateStorageUnitUseCase,
  DeleteStorageUnitUseCase,
  GetAllStorageUnitsUseCase,
  GetStorageUnitByIdUseCase,
  UpdateStorageUnitDto,
  UpdateStorageUnitUseCase
} from '../../app/use-cases/storage-unit';

@Controller('storage-unit')
export class StorageUnitController {
  constructor(
    private readonly createStorageUnitUseCase: CreateStorageUnitUseCase,
    private readonly getStorageUnitByIdUseCase: GetStorageUnitByIdUseCase,
    private readonly getAllStorageUnitsUseCase: GetAllStorageUnitsUseCase,
    private readonly updateStorageUnitUseCase: UpdateStorageUnitUseCase,
    private readonly deleteStorageUnitUseCase: DeleteStorageUnitUseCase,
  ) { }

  @Post()
  async create(@Body() createStorageUnitDto: CreateStorageUnitDto) {
    return this.createStorageUnitUseCase.call(createStorageUnitDto);
  }

  @Get()
  async findAll() {
    return this.getAllStorageUnitsUseCase.call();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.getStorageUnitByIdUseCase.call(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateStorageUnitDto: UpdateStorageUnitDto) {
    return this.updateStorageUnitUseCase.call({ id, data: updateStorageUnitDto });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.deleteStorageUnitUseCase.call(id);
  }
} 