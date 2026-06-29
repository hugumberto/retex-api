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
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CreateBlogCategoryUseCase } from '../../app/use-cases/blog-category/create-blog-category-use-case';
import { DeleteBlogCategoryUseCase } from '../../app/use-cases/blog-category/delete-blog-category-use-case';
import { GetAllBlogCategoriesUseCase } from '../../app/use-cases/blog-category/get-all-blog-categories-use-case';
import { UpdateBlogCategoryUseCase } from '../../app/use-cases/blog-category/update-blog-category-use-case';
import { BlogCategoryStatus } from '../../domain/blog-post/blog-category.entity';
import { Role } from '../../domain/user/user-roles.entity';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

class CreateBlogCategoryDto {
  @IsString() @IsNotEmpty() title: string;
  @IsEnum(BlogCategoryStatus) @IsOptional() status?: BlogCategoryStatus;
}

class UpdateBlogCategoryDto {
  @IsString() @IsOptional() title?: string;
  @IsEnum(BlogCategoryStatus) @IsOptional() status?: BlogCategoryStatus;
}

@ApiTags('blog-categories')
@Controller('blog-category')
export class BlogCategoryController {
  constructor(
    private readonly getAllBlogCategoriesUseCase: GetAllBlogCategoriesUseCase,
    private readonly createBlogCategoryUseCase: CreateBlogCategoryUseCase,
    private readonly updateBlogCategoryUseCase: UpdateBlogCategoryUseCase,
    private readonly deleteBlogCategoryUseCase: DeleteBlogCategoryUseCase,
  ) {}

  @Get('public')
  @Public()
  @ApiOperation({ summary: 'Listar categorias ativas (endpoint público)' })
  getPublic() {
    return this.getAllBlogCategoriesUseCase.call({ onlyActive: true });
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todas as categorias' })
  getAll() {
    return this.getAllBlogCategoriesUseCase.call();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar categoria' })
  create(@Body() dto: CreateBlogCategoryDto) {
    return this.createBlogCategoryUseCase.call(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar categoria' })
  update(@Param('id') id: string, @Body() dto: UpdateBlogCategoryDto) {
    return this.updateBlogCategoryUseCase.call({ id, ...dto });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deletar categoria' })
  delete(@Param('id') id: string) {
    return this.deleteBlogCategoryUseCase.call({ id });
  }
}
