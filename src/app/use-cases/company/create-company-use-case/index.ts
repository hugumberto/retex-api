import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CompanyProfileKey } from '../../../../domain/company/company-profile.entity';
import { Company, CompanyStatus } from '../../../../domain/company/company.entity';
import {
  ICompanyMemberRepository,
  ICompanyProfileRepository,
  ICompanyRepository,
} from '../../../../domain/company/company.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUserRoleRepository } from '../../../../domain/user/user-role.repository';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { ICryptoService } from '../../../services/interfaces/crypto.interface';
import { SERVICE_TOKENS } from '../../../services/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { generateUniqueFriendlyCode } from '../../shared/friendly-code.util';
import { SendActivationEmailUseCase } from '../../user/send-activation-email-use-case';
import { provisionMember } from '../provision-member.util';
import { CreateCompanyDto } from './create-company.dto';

export interface CreateCompanyResult {
  company: Company;
  managerId: string;
}

/**
 * Cadastra uma empresa e o seu gestor inicial (ADMIN, pelo portal).
 *
 * O gestor recebe o email de ativação e define a própria password — a Retex
 * nunca escolhe passwords de clientes.
 */
@Injectable()
export class CreateCompanyUseCase
  implements IUseCase<CreateCompanyDto, CreateCompanyResult>
{
  private readonly logger = new Logger(CreateCompanyUseCase.name);

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

  async call(param: CreateCompanyDto): Promise<CreateCompanyResult> {
    const existingByTaxId = await this.companyRepository.findOne({
      taxId: param.taxId,
    } as Partial<Company>);
    if (existingByTaxId) {
      throw new ConflictException('errors.company.taxIdAlreadyExists');
    }

    const managerProfile = await this.companyProfileRepository.findByKey(
      CompanyProfileKey.MANAGER,
    );
    if (!managerProfile) {
      throw new NotFoundException('errors.company.profileNotFound');
    }

    const friendlyCode = await generateUniqueFriendlyCode((code) =>
      this.companyRepository.findOne({ friendlyCode: code } as Partial<Company>),
    );

    const company = (await this.companyRepository.create({
      name: param.name,
      legalName: param.legalName ?? null,
      taxId: param.taxId,
      email: param.email ?? null,
      phone: param.phone ?? null,
      status: CompanyStatus.ACTIVE,
      friendlyCode,
    } as Partial<Company>)) as Company;

    const manager = await provisionMember(
      { ...param.manager, companyId: company.id, profileId: managerProfile.id },
      {
        userRepository: this.userRepository,
        userRoleRepository: this.userRoleRepository,
        companyMemberRepository: this.companyMemberRepository,
        cryptoService: this.cryptoService,
      },
    );

    // Fire-and-forget: a empresa fica criada mesmo que o SMTP falhe; o admin
    // pode reenviar a ativação pelo ecrã de utilizadores.
    this.sendActivationEmail
      .call({ email: manager.email })
      .catch((err) =>
        this.logger.error(
          `Falha ao enviar ativação ao gestor ${manager.email}: ${err.message}`,
        ),
      );

    return { company, managerId: manager.id };
  }
}
