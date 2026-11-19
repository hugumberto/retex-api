import { CompanyKind } from '../../../../domain/company/company.entity';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class CreateCompanyManagerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  lastName: string;

  @IsEmail({}, { message: 'Email deve ser válido' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  contactPhone?: string;
}

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  legalName?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  taxId: string;

  @IsEmail({}, { message: 'Email deve ser válido' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  // Empresa, município, escola ou associação. Por omissão, empresa.
  @IsEnum(CompanyKind)
  @IsOptional()
  kind?: CompanyKind;

  // Gestor inicial da empresa. Recebe email de ativação para definir a password.
  @IsObject()
  @ValidateNested()
  @Type(() => CreateCompanyManagerDto)
  manager: CreateCompanyManagerDto;
}
