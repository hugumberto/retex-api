import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { BlogPostHighlight } from '../../../../domain/blog-post/blog-post-highlight.enum';

export class UpsertBlogPostDto {
  @IsOptional()
  @IsUUID('4', { message: 'ID deve ser um UUID válido' })
  id?: string;

  @IsString({ message: 'Corpo do post deve ser uma string' })
  @IsNotEmpty({ message: 'Corpo do post é obrigatório' })
  body: string;

  @IsString({ message: 'Slug deve ser uma string' })
  @IsNotEmpty({ message: 'Slug é obrigatório' })
  slug: string;

  @IsString({ message: 'Título deve ser uma string' })
  @IsNotEmpty({ message: 'Título é obrigatório' })
  title: string;

  @IsString({ message: 'Hero deve ser uma string' })
  @IsNotEmpty({ message: 'Hero é obrigatório' })
  hero: string;

  @IsOptional()
  @IsEnum(BlogPostHighlight, { message: 'Highlight deve ser NONE, FEATURED ou HIGHLIGHTED' })
  highlight?: BlogPostHighlight = BlogPostHighlight.NONE;

  @IsOptional()
  @IsArray({ message: 'Tags deve ser um array' })
  @ArrayMaxSize(30, { message: 'Máximo de 30 tags' })
  @IsString({ each: true, message: 'Cada tag deve ser uma string' })
  @Type(() => String)
  tags?: string[] = [];

  @IsOptional()
  @IsArray({ message: 'Categorias deve ser um array' })
  @ArrayMaxSize(20, { message: 'Máximo de 20 categorias' })
  @IsUUID('4', { each: true, message: 'Cada categoria deve ser um UUID válido' })
  categoryIds?: string[];
}
