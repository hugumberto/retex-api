import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateCompanyMemberDto {
  @IsString() @IsNotEmpty() @MaxLength(255) firstName: string;
  @IsString() @IsNotEmpty() @MaxLength(255) lastName: string;
  @IsEmail({}, { message: 'Email deve ser válido' }) @IsNotEmpty() email: string;
  @IsString() @IsOptional() @MaxLength(20) contactPhone?: string;
  // Perfil do membro. Hoje a UI oferece só COLLABORATOR; a API aceita qualquer
  // perfil disponível para a empresa.
  @IsUUID() @IsNotEmpty() profileId: string;
}
