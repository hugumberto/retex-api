import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Gender } from '../../../../domain/user/gender.enum';

export class RegisterAddressDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  street: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  number?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  complement?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  city?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  cityDivision?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  country?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  countryDivision?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
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
