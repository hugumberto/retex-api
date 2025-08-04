import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UserStatus } from '../../../../domain/user/user-status.enum';

export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: 'Nome deve ser uma string' })
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'Sobrenome deve ser uma string' })
  lastName?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email deve ser válido' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'Telefone deve ser uma string' })
  contactPhone?: string;

  @IsOptional()
  @IsString({ message: 'Número do documento deve ser uma string' })
  documentNumber?: string;

  @IsOptional()
  @IsString({ message: 'Senha deve ser uma string' })
  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  password?: string;

  @IsOptional()
  @IsEnum(UserStatus, { message: 'Status deve ser ACTIVE ou INACTIVE' })
  status?: UserStatus;
} 