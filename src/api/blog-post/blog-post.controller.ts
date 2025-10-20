import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DeleteBlogPostUseCase } from '../../app/use-cases/blog-post/delete-blog-post-use-case';
import { GetAllBlogPostsUseCase } from '../../app/use-cases/blog-post/get-all-blog-posts-use-case';
import { GetAllBlogPostsDto } from '../../app/use-cases/blog-post/get-all-blog-posts-use-case/get-all-blog-posts.dto';
import { GetPublicBlogPostsUseCase } from '../../app/use-cases/blog-post/get-public-blog-posts-use-case';
import { GetPublicBlogPostsDto } from '../../app/use-cases/blog-post/get-public-blog-posts-use-case/get-public-blog-posts.dto';
import { PublishBlogPostUseCase } from '../../app/use-cases/blog-post/publish-blog-post-use-case';
import { UpsertBlogPostUseCase } from '../../app/use-cases/blog-post/upsert-blog-post-use-case';
import { UpsertBlogPostDto } from '../../app/use-cases/blog-post/upsert-blog-post-use-case/upsert-blog-post.dto';
import { BlogPostHighlight } from '../../domain/blog-post/blog-post-highlight.enum';
import { BlogPostStatus } from '../../domain/blog-post/blog-post-status.enum';
import { BlogPost } from '../../domain/blog-post/blog-post.entity';
import { PaginatedResult } from '../../domain/interfaces/pagination.interface';
import { Role } from '../../domain/user/user-roles.entity';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('blog-posts')
@Controller('blog-post')
export class BlogPostController {
  constructor(
    private readonly upsertBlogPostUseCase: UpsertBlogPostUseCase,
    private readonly publishBlogPostUseCase: PublishBlogPostUseCase,
    private readonly deleteBlogPostUseCase: DeleteBlogPostUseCase,
    private readonly getPublicBlogPostsUseCase: GetPublicBlogPostsUseCase,
    private readonly getAllBlogPostsUseCase: GetAllBlogPostsUseCase,
  ) { }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar ou atualizar post (upsert)' })
  @ApiResponse({
    status: 201,
    description: 'Post criado/atualizado com sucesso',
    type: Object
  })
  @ApiResponse({ status: 409, description: 'Slug já existe' })
  @ApiResponse({ status: 404, description: 'Post não encontrado (para update)' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async upsertBlogPost(@Body() upsertBlogPostDto: UpsertBlogPostDto): Promise<BlogPost> {
    return this.upsertBlogPostUseCase.call(upsertBlogPostDto);
  }

  @Put(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publicar post' })
  @ApiResponse({
    status: 200,
    description: 'Post publicado com sucesso',
    type: Object
  })
  @ApiResponse({ status: 404, description: 'Post não encontrado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async publishBlogPost(@Param('id') id: string): Promise<BlogPost> {
    return this.publishBlogPostUseCase.call({ id });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deletar post' })
  @ApiResponse({
    status: 200,
    description: 'Post deletado com sucesso',
    type: Object
  })
  @ApiResponse({ status: 404, description: 'Post não encontrado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async deleteBlogPost(@Param('id') id: string): Promise<BlogPost> {
    return this.deleteBlogPostUseCase.call({ id });
  }

  @Get('public')
  @ApiOperation({ summary: 'Listar posts publicados (endpoint público)' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por título, conteúdo ou tags' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página (padrão: 10, máx: 100)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de posts publicados ordenados por highlight e data',
    type: Object
  })
  async getPublicBlogPosts(@Query() query: GetPublicBlogPostsDto): Promise<PaginatedResult<BlogPost>> {
    return this.getPublicBlogPostsUseCase.call(query);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos os posts com filtros' })
  @ApiQuery({ name: 'status', required: false, enum: BlogPostStatus, description: 'Filtrar por status' })
  @ApiQuery({ name: 'highlight', required: false, enum: BlogPostHighlight, description: 'Filtrar por highlight' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por título, conteúdo ou tags' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página (padrão: 10, máx: 100)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de posts com filtros aplicados',
    type: Object
  })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async getAllBlogPosts(@Query() query: GetAllBlogPostsDto): Promise<PaginatedResult<BlogPost>> {
    return this.getAllBlogPostsUseCase.call(query);
  }
}
