import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
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
  @Matches(/^(-?\d+(\.\d+)?)?$/, { message: 'lat deve ser um número' })
  lat?: string;

  @IsString()
  @IsOptional()
  @Matches(/^(-?\d+(\.\d+)?)?$/, { message: 'long deve ser um número' })
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
  @MinLength(8, { message: 'Senha deve ter pelo menos 8 caracteres' })
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
