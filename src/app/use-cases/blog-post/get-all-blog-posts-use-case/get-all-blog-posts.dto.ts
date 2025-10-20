import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { BlogPostHighlight } from '../../../../domain/blog-post/blog-post-highlight.enum';
import { BlogPostStatus } from '../../../../domain/blog-post/blog-post-status.enum';

export class GetAllBlogPostsDto {
  @IsOptional()
  @IsEnum(BlogPostStatus, { message: 'Status deve ser DRAFT ou PUBLISHED' })
  status?: BlogPostStatus;

  @IsOptional()
  @IsEnum(BlogPostHighlight, { message: 'Highlight deve ser NONE, FEATURED ou HIGHLIGHTED' })
  highlight?: BlogPostHighlight;

  @IsOptional()
  @IsString({ message: 'Busca deve ser uma string' })
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Página deve ser um número' })
  @Min(1, { message: 'Página deve ser maior que 0' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Limite deve ser um número' })
  @Min(1, { message: 'Limite deve ser maior que 0' })
  @Max(100, { message: 'Limite não pode ser maior que 100' })
  limit?: number = 10;
}
