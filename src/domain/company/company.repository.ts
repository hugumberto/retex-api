import {
  PaginatedResult,
  PaginationParams,
} from '../interfaces/pagination.interface';
import { IRepository } from '../interfaces/repository.interface';
import { CompanyMember } from './company-member.entity';
import { CompanyProfile } from './company-profile.entity';
import { Company, CompanyStatus } from './company.entity';

export interface CompanyFilters {
  status?: CompanyStatus;
  search?: string;
}

export interface ICompanyRepository extends IRepository<Company> {
  findByFiltersWithPagination(
    filters: CompanyFilters,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<Company>>;
}

export interface ICompanyProfileRepository extends IRepository<CompanyProfile> {
  // Perfis de sistema (companyId null) mais os próprios da empresa indicada.
  findAvailableForCompany(companyId: string): Promise<CompanyProfile[]>;
  findByKey(key: string): Promise<CompanyProfile | null>;
}

export interface ICompanyMemberRepository extends IRepository<CompanyMember> {
  // Membro de um utilizador, com `company` e `profile` carregados. É o que
  // alimenta o CompanyContextService a cada pedido.
  findByUserWithRelations(userId: string): Promise<CompanyMember | null>;
  findByCompanyWithRelations(companyId: string): Promise<CompanyMember[]>;
}
