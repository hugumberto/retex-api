import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ArrayMaxSize, IsArray, IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ReorderFaqUseCase } from '../../app/use-cases/faq/reorder-faq-use-case';
import { CreateFaqCategoryUseCase } from '../../app/use-cases/faq/create-faq-category-use-case';
import { CreateFaqItemUseCase } from '../../app/use-cases/faq/create-faq-item-use-case';
import { DeleteFaqCategoryUseCase } from '../../app/use-cases/faq/delete-faq-category-use-case';
import { DeleteFaqItemUseCase } from '../../app/use-cases/faq/delete-faq-item-use-case';
import { GetAllFaqCategoriesUseCase } from '../../app/use-cases/faq/get-all-faq-categories-use-case';
import { GetPublicFaqUseCase } from '../../app/use-cases/faq/get-public-faq-use-case';
import { UpdateFaqCategoryUseCase } from '../../app/use-cases/faq/update-faq-category-use-case';
import { UpdateFaqItemUseCase } from '../../app/use-cases/faq/update-faq-item-use-case';
import { FaqStatus } from '../../domain/faq/faq-category.entity';
import { Role } from '../../domain/user/user-roles.entity';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

class CreateFaqCategoryDto {
  @IsString() @IsNotEmpty() title: string;
  @IsString() @IsOptional() description?: string;
  @IsEnum(FaqStatus) @IsOptional() status?: FaqStatus;
}

class UpdateFaqCategoryDto {
  @IsString() @IsOptional() title?: string;
  @IsString() @IsOptional() description?: string;
  @IsEnum(FaqStatus) @IsOptional() status?: FaqStatus;
}

class CreateFaqItemDto {
  @IsString() @IsNotEmpty() title: string;
  @IsString() @IsNotEmpty() description: string;
  @IsBoolean() @IsOptional() visible?: boolean;
}

class UpdateFaqItemDto {
  @IsString() @IsOptional() title?: string;
  @IsString() @IsOptional() description?: string;
  @IsBoolean() @IsOptional() visible?: boolean;
  @IsUUID('4') @IsOptional() categoryId?: string;
}

class ReorderFaqDto {
  @IsArray() @ArrayMaxSize(500) @IsUUID('4', { each: true }) ids: string[];
}

@Controller('faq')
export class FaqController {
  constructor(
    private readonly getPublicFaqUseCase: GetPublicFaqUseCase,
    private readonly getAllFaqCategoriesUseCase: GetAllFaqCategoriesUseCase,
    private readonly createFaqCategoryUseCase: CreateFaqCategoryUseCase,
    private readonly updateFaqCategoryUseCase: UpdateFaqCategoryUseCase,
    private readonly deleteFaqCategoryUseCase: DeleteFaqCategoryUseCase,
    private readonly createFaqItemUseCase: CreateFaqItemUseCase,
    private readonly updateFaqItemUseCase: UpdateFaqItemUseCase,
    private readonly deleteFaqItemUseCase: DeleteFaqItemUseCase,
    private readonly reorderFaqUseCase: ReorderFaqUseCase,
  ) {}

  @Get()
  @Public()
  getPublic() {
    return this.getPublicFaqUseCase.call();
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OPS)
  getAll() {
    return this.getAllFaqCategoriesUseCase.call();
  }

  // Ordem dos grupos.
  @Put('order')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OPS)
  reorderCategories(@Body() dto: ReorderFaqDto) {
    return this.reorderFaqUseCase.call({ ids: dto.ids });
  }

  // Ordem das perguntas de um grupo.
  @Put('category/:id/order')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OPS)
  reorderItems(@Param('id') id: string, @Body() dto: ReorderFaqDto) {
    return this.reorderFaqUseCase.call({ categoryId: id, ids: dto.ids });
  }

  @Post('category')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OPS)
  createCategory(@Body() dto: CreateFaqCategoryDto) {
    return this.createFaqCategoryUseCase.call(dto);
  }

  @Patch('category/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OPS)
  updateCategory(@Param('id') id: string, @Body() dto: UpdateFaqCategoryDto) {
    return this.updateFaqCategoryUseCase.call({ id, ...dto });
  }

  @Delete('category/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OPS)
  deleteCategory(@Param('id') id: string) {
    return this.deleteFaqCategoryUseCase.call({ id });
  }

  @Post('category/:categoryId/item')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OPS)
  createItem(@Param('categoryId') categoryId: string, @Body() dto: CreateFaqItemDto) {
    return this.createFaqItemUseCase.call({ ...dto, categoryId });
  }

  @Patch('item/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OPS)
  updateItem(@Param('id') id: string, @Body() dto: UpdateFaqItemDto) {
    return this.updateFaqItemUseCase.call({ id, ...dto });
  }

  @Delete('item/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OPS)
  deleteItem(@Param('id') id: string) {
    return this.deleteFaqItemUseCase.call({ id });
  }
}
