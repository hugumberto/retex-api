import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import {
  CreateBrandDto,
  CreateBrandUseCase,
  DeleteBrandUseCase,
  GetAllBrandsUseCase,
  GetBrandByIdUseCase,
  UpdateBrandDto,
  UpdateBrandUseCase
} from '../../app/use-cases/brand';

@Controller('brand')
export class BrandController {
  constructor(
    private readonly createBrandUseCase: CreateBrandUseCase,
    private readonly getBrandByIdUseCase: GetBrandByIdUseCase,
    private readonly getAllBrandsUseCase: GetAllBrandsUseCase,
    private readonly updateBrandUseCase: UpdateBrandUseCase,
    private readonly deleteBrandUseCase: DeleteBrandUseCase,
  ) { }

  @Post()
  async create(@Body() createBrandDto: CreateBrandDto) {
    return this.createBrandUseCase.call(createBrandDto);
  }

  @Get()
  async findAll() {
    return this.getAllBrandsUseCase.call();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.getBrandByIdUseCase.call(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateBrandDto: UpdateBrandDto) {
    return this.updateBrandUseCase.call({ id, data: updateBrandDto });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.deleteBrandUseCase.call(id);
  }
} 