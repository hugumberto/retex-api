import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CompanyMember,
  CompanyMemberStatus,
} from '../../../../domain/company/company-member.entity';
import { CompanyProfile } from '../../../../domain/company/company-profile.entity';
import {
  ICompanyMemberRepository,
  ICompanyProfileRepository,
} from '../../../../domain/company/company.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { UserStatus } from '../../../../domain/user/user-status.enum';
import { User } from '../../../../domain/user/user.entity';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { IUseCase } from '../../interfaces/use-case.interface';
import { UpdateCompanyMemberDto } from './update-company-member.dto';

export interface UpdateCompanyMemberParam {
  companyId: string;
  memberId: string;
  data: UpdateCompanyMemberDto;
}

@Injectable()
export class UpdateCompanyMemberUseCase
  implements IUseCase<UpdateCompanyMemberParam, CompanyMember>
{
  constructor(
    @Inject(DOMAIN_TOKENS.COMPANY_MEMBER_REPOSITORY)
    private readonly companyMemberRepository: ICompanyMemberRepository,
    @Inject(DOMAIN_TOKENS.COMPANY_PROFILE_REPOSITORY)
    private readonly companyProfileRepository: ICompanyProfileRepository,
    @Inject(DOMAIN_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) { }

  async call({
    companyId,
    memberId,
    data,
  }: UpdateCompanyMemberParam): Promise<CompanyMember> {
    const member = await this.companyMemberRepository.findOne({
      id: memberId,
    } as Partial<CompanyMember>);

    // 404 (e não 403) para não revelar membros de outras empresas — mesma
    // convenção já usada nas solicitações.
    if (!member || member.companyId !== companyId) {
      throw new NotFoundException('errors.company.memberNotFound');
    }

    if (data.profileId && data.profileId !== member.profileId) {
      const profile = await this.companyProfileRepository.findOne({
        id: data.profileId,
      } as Partial<CompanyProfile>);
      if (!profile) {
        throw new NotFoundException('errors.company.profileNotFound');
      }
      if (profile.companyId && profile.companyId !== companyId) {
        throw new BadRequestException('errors.company.profileNotAvailable');
      }
    }

    const [updated] = await this.companyMemberRepository.update(
      { id: memberId },
      data as Partial<CompanyMember>,
    );

    // Suspender o membro tem de cortar o acesso à plataforma, não só à empresa:
    // caso contrário continuava a entrar como particular.
    if (data.status === CompanyMemberStatus.INACTIVE) {
      await this.userRepository.update(
        { id: member.userId } as Partial<User>,
        { status: UserStatus.INACTIVE } as Partial<User>,
      );
    }

    return updated;
  }
}
