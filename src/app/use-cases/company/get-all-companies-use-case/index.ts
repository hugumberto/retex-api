import { Inject, Injectable } from '@nestjs/common';
import { Company } from '../../../../domain/company/company.entity';
import { ICompanyRepository } from '../../../../domain/company/company.repository';
import { PaginatedResult } from '../../../../domain/interfaces/pagination.interface';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { GetCompaniesDto } from './get-companies.dto';

@Injectable()
export class GetAllCompaniesUseCase
  implements IUseCase<GetCompaniesDto | undefined, PaginatedResult<Company>>
{
  constructor(
    @Inject(DOMAIN_TOKENS.COMPANY_REPOSITORY)
    private readonly companyRepository: ICompanyRepository,
  ) { }

  async call(param?: GetCompaniesDto): Promise<PaginatedResult<Company>> {
    return this.companyRepository.findByFiltersWithPagination(
      { status: param?.status, search: param?.search },
      { page: param?.page || 1, limit: param?.limit || 50 },
    );
  }
}
