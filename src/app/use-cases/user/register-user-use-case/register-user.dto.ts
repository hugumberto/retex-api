import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Gender } from '../../../../domain/user/gender.enum';

export class RegisterAddressDto {
  @IsString()
  @IsNotEmpty()
  street: string;

  @IsString()
  @IsOptional()
  number?: string;

  @IsString()
  @IsOptional()
  complement?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  cityDivision?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  countryDivision?: string;

  @IsString()
  @IsNotEmpty()
  zipCode: string;

  @IsString()
  @IsOptional()
  lat?: string;

  @IsString()
  @IsOptional()
  long?: string;
}

export class RegisterUserDto {
  @IsString({ message: 'Nome deve ser uma string' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  firstName: string;

  @IsString({ message: 'Sobrenome deve ser uma string' })
  @IsNotEmpty({ message: 'Sobrenome é obrigatório' })
  lastName: string;

  @IsEmail({}, { message: 'Email deve ser válido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  @IsString({ message: 'Telefone deve ser uma string' })
  @IsOptional()
  contactPhone?: string;

  @IsString({ message: 'Senha deve ser uma string' })
  @IsOptional()
  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  password?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => RegisterAddressDto)
  address: RegisterAddressDto;
}
