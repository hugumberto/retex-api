import { CreateCompanyAddressUseCase } from './create-company-address-use-case';
import { CreateCompanyMemberUseCase } from './create-company-member-use-case';
import { CreateCompanyUseCase } from './create-company-use-case';
import { GetAllCompaniesUseCase } from './get-all-companies-use-case';
import { GetCompanyByIdUseCase } from './get-company-by-id-use-case';
import { GetCompanyAddressesUseCase } from './get-company-addresses-use-case';
import { GetCompanyMembersUseCase } from './get-company-members-use-case';
import { GetCompanyProfilesUseCase } from './get-company-profiles-use-case';
import { UpdateCompanyMemberUseCase } from './update-company-member-use-case';
import { UpdateCompanyUseCase } from './update-company-use-case';

export const COMPANY_USE_CASES = [
  CreateCompanyUseCase,
  GetAllCompaniesUseCase,
  GetCompanyByIdUseCase,
  UpdateCompanyUseCase,
  CreateCompanyMemberUseCase,
  UpdateCompanyMemberUseCase,
  GetCompanyMembersUseCase,
  GetCompanyProfilesUseCase,
  CreateCompanyAddressUseCase,
  GetCompanyAddressesUseCase,
];

export * from './create-company-address-use-case';
export * from './create-company-member-use-case';
export * from './create-company-use-case';
export * from './get-all-companies-use-case';
export * from './get-company-by-id-use-case';
export * from './get-company-addresses-use-case';
export * from './get-company-members-use-case';
export * from './get-company-profiles-use-case';
export * from './update-company-member-use-case';
export * from './update-company-use-case';
