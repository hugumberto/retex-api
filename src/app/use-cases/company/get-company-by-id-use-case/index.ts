import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Company } from '../../../../domain/company/company.entity';
import { ICompanyRepository } from '../../../../domain/company/company.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

@Injectable()
export class GetCompanyByIdUseCase implements IUseCase<string, Company> {
  constructor(
    @Inject(DOMAIN_TOKENS.COMPANY_REPOSITORY)
    private readonly companyRepository: ICompanyRepository,
  ) { }

  async call(id: string): Promise<Company> {
    const company = await this.companyRepository.findOne({ id } as Partial<Company>);
    if (!company) {
      throw new NotFoundException('errors.company.notFound');
    }
    return company;
  }
}
