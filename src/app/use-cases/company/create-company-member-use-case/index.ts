import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CompanyProfile } from '../../../../domain/company/company-profile.entity';
import { Company } from '../../../../domain/company/company.entity';
import {
  ICompanyMemberRepository,
  ICompanyProfileRepository,
  ICompanyRepository,
} from '../../../../domain/company/company.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUserRoleRepository } from '../../../../domain/user/user-role.repository';
import { User } from '../../../../domain/user/user.entity';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { ICryptoService } from '../../../services/interfaces/crypto.interface';
import { SERVICE_TOKENS } from '../../../services/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { SendActivationEmailUseCase } from '../../user/send-activation-email-use-case';
import { provisionMember } from '../provision-member.util';
import { CreateCompanyMemberDto } from './create-company-member.dto';

export interface CreateCompanyMemberParam {
  companyId: string;
  data: CreateCompanyMemberDto;
}

@Injectable()
export class CreateCompanyMemberUseCase
  implements IUseCase<CreateCompanyMemberParam, Omit<User, 'password'>>
{
  private readonly logger = new Logger(CreateCompanyMemberUseCase.name);

  constructor(
    @Inject(DOMAIN_TOKENS.COMPANY_REPOSITORY)
    private readonly companyRepository: ICompanyRepository,
    @Inject(DOMAIN_TOKENS.COMPANY_PROFILE_REPOSITORY)
    private readonly companyProfileRepository: ICompanyProfileRepository,
    @Inject(DOMAIN_TOKENS.COMPANY_MEMBER_REPOSITORY)
    private readonly companyMemberRepository: ICompanyMemberRepository,
    @Inject(DOMAIN_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(DOMAIN_TOKENS.USER_ROLE_REPOSITORY)
    private readonly userRoleRepository: IUserRoleRepository,
    @Inject(SERVICE_TOKENS.CRYPTO_SERVICE)
    private readonly cryptoService: ICryptoService,
    private readonly sendActivationEmail: SendActivationEmailUseCase,
  ) { }

  async call({
    companyId,
    data,
  }: CreateCompanyMemberParam): Promise<Omit<User, 'password'>> {
    const company = await this.companyRepository.findOne({
      id: companyId,
    } as Partial<Company>);
    if (!company) {
      throw new NotFoundException('errors.company.notFound');
    }

    const profile = await this.companyProfileRepository.findOne({
      id: data.profileId,
    } as Partial<CompanyProfile>);
    if (!profile) {
      throw new NotFoundException('errors.company.profileNotFound');
    }

    // Um perfil próprio de outra empresa não pode ser atribuído aqui.
    if (profile.companyId && profile.companyId !== companyId) {
      throw new BadRequestException('errors.company.profileNotAvailable');
    }

    const member = await provisionMember(
      { ...data, companyId, profileId: profile.id },
      {
        userRepository: this.userRepository,
        userRoleRepository: this.userRoleRepository,
        companyMemberRepository: this.companyMemberRepository,
        cryptoService: this.cryptoService,
      },
    );

    this.sendActivationEmail
      .call({ email: member.email })
      .catch((err) =>
        this.logger.error(
          `Falha ao enviar ativação ao membro ${member.email}: ${err.message}`,
        ),
      );

    const { password, ...withoutPassword } = member;
    return withoutPassword;
  }
}
