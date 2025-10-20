import { IsNotEmpty, IsUUID } from 'class-validator';

export class PublishBlogPostDto {
  @IsUUID('4', { message: 'ID deve ser um UUID válido' })
  @IsNotEmpty({ message: 'ID é obrigatório' })
  id: string;
}
