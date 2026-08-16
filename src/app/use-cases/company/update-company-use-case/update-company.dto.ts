import { IsEmail, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { CompanyStatus } from '../../../../domain/company/company.entity';

export class UpdateCompanyDto {
  @IsString() @IsOptional() @MaxLength(255) name?: string;
  @IsString() @IsOptional() @MaxLength(255) legalName?: string;
  @IsString() @IsOptional() @MaxLength(32) taxId?: string;
  @IsEmail({}, { message: 'Email deve ser válido' }) @IsOptional() email?: string;
  @IsString() @IsOptional() @MaxLength(20) phone?: string;
  @IsEnum(CompanyStatus) @IsOptional() status?: CompanyStatus;
}
