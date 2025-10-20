import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class GetPublicBlogPostsDto {
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
