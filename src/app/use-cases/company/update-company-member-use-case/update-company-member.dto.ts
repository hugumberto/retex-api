import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { CompanyMemberStatus } from '../../../../domain/company/company-member.entity';

export class UpdateCompanyMemberDto {
  @IsUUID() @IsOptional() profileId?: string;
  @IsEnum(CompanyMemberStatus) @IsOptional() status?: CompanyMemberStatus;
}
