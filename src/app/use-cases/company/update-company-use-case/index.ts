import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CompanyMemberStatus } from '../../../../domain/company/company-member.entity';
import { Company, CompanyStatus } from '../../../../domain/company/company.entity';
import {
  ICompanyMemberRepository,
  ICompanyRepository,
} from '../../../../domain/company/company.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { UpdateCompanyDto } from './update-company.dto';

export interface UpdateCompanyParam {
  id: string;
  data: UpdateCompanyDto;
}

@Injectable()
export class UpdateCompanyUseCase
  implements IUseCase<UpdateCompanyParam, Company>
{
  constructor(
    @Inject(DOMAIN_TOKENS.COMPANY_REPOSITORY)
    private readonly companyRepository: ICompanyRepository,
    @Inject(DOMAIN_TOKENS.COMPANY_MEMBER_REPOSITORY)
    private readonly companyMemberRepository: ICompanyMemberRepository,
  ) { }

  async call({ id, data }: UpdateCompanyParam): Promise<Company> {
    const company = await this.companyRepository.findOne({
      id,
    } as Partial<Company>);
    if (!company) {
      throw new NotFoundException('errors.company.notFound');
    }

    if (data.taxId && data.taxId !== company.taxId) {
      const existing = await this.companyRepository.findOne({
        taxId: data.taxId,
      } as Partial<Company>);
      if (existing) {
        throw new ConflictException('errors.company.taxIdAlreadyExists');
      }
    }

    const [updated] = await this.companyRepository.update(
      { id } as Partial<Company>,
      data as Partial<Company>,
    );

    // Desativar a empresa suspende os acessos de todos os membros. Não há
    // reativação em cascata: ao reativar a empresa, o gestor decide quem volta.
    if (data.status === CompanyStatus.INACTIVE) {
      await this.companyMemberRepository.update(
        { companyId: id },
        { status: CompanyMemberStatus.INACTIVE },
      );
    }

    return updated;
  }
}
