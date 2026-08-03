import { Inject, Injectable } from '@nestjs/common';
import { CompanyMember } from '../../../../domain/company/company-member.entity';
import { ICompanyMemberRepository } from '../../../../domain/company/company.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

@Injectable()
export class GetCompanyMembersUseCase
  implements IUseCase<string, CompanyMember[]>
{
  constructor(
    @Inject(DOMAIN_TOKENS.COMPANY_MEMBER_REPOSITORY)
    private readonly companyMemberRepository: ICompanyMemberRepository,
  ) { }

  async call(companyId: string): Promise<CompanyMember[]> {
    const members =
      await this.companyMemberRepository.findByCompanyWithRelations(companyId);

    // A password vem do repositório por não ter `select: false` no schema.
    return members.map((member) => {
      if (member.user) {
        const { password, ...user } = member.user;
        return { ...member, user } as CompanyMember;
      }
      return member;
    });
  }
}
