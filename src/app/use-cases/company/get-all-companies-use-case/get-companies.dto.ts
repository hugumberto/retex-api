import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { CompanyStatus } from '../../../../domain/company/company.entity';

export class GetCompaniesDto {
  @IsOptional()
  @IsEnum(CompanyStatus)
  status?: CompanyStatus;

  // Procura por nome, razão social ou NIF.
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(1000)
  limit?: number = 50;
}
