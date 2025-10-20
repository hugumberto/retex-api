import { IsNotEmpty, IsUUID } from 'class-validator';

export class DeleteBlogPostDto {
  @IsUUID('4', { message: 'ID deve ser um UUID válido' })
  @IsNotEmpty({ message: 'ID é obrigatório' })
  id: string;
}
