import { Inject, Injectable } from '@nestjs/common';
import { CompanyProfile } from '../../../../domain/company/company-profile.entity';
import { ICompanyProfileRepository } from '../../../../domain/company/company.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

/**
 * Perfis atribuíveis numa empresa: os de sistema mais os próprios dela.
 * Hoje devolve MANAGER e COLLABORATOR; a estrutura já suporta mais.
 */
@Injectable()
export class GetCompanyProfilesUseCase
  implements IUseCase<string, CompanyProfile[]>
{
  constructor(
    @Inject(DOMAIN_TOKENS.COMPANY_PROFILE_REPOSITORY)
    private readonly companyProfileRepository: ICompanyProfileRepository,
  ) { }

  async call(companyId: string): Promise<CompanyProfile[]> {
    return this.companyProfileRepository.findAvailableForCompany(companyId);
  }
}
