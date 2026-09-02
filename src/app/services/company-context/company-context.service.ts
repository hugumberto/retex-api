import { Inject, Injectable } from '@nestjs/common';
import { CompanyMemberStatus } from '../../../domain/company/company-member.entity';
import {
  CompanyPermission,
  CompanyProfile,
} from '../../../domain/company/company-profile.entity';
import { Company, CompanyStatus } from '../../../domain/company/company.entity';
import { ICompanyMemberRepository } from '../../../domain/company/company.repository';
import { DOMAIN_TOKENS } from '../../../domain/tokens';

export interface CompanyContext {
  companyId: string;
  company: Company;
  profile: CompanyProfile;
  permissions: CompanyPermission[];
}

/**
 * Resolve o contexto de empresa de um utilizador a cada pedido.
 *
 * Deliberadamente **fora do JWT**: o `JwtAuthGuard` não consulta a base de
 * dados, portanto o que estiver no token só muda no refresh. Um perfil
 * revogado que continuasse válido até o token expirar seria uma falha de
 * segurança — o custo de uma query é o preço certo.
 *
 * Devolve `null` para quem não é membro de empresa (o caso dos particulares),
 * e também quando a empresa ou a associação estão inativas — o utilizador
 * volta a comportar-se como particular em vez de manter acessos.
 */
@Injectable()
export class CompanyContextService {
  constructor(
    @Inject(DOMAIN_TOKENS.COMPANY_MEMBER_REPOSITORY)
    private readonly companyMemberRepository: ICompanyMemberRepository,
  ) { }

  async resolve(userId: string): Promise<CompanyContext | null> {
    if (!userId) {
      return null;
    }

    const member =
      await this.companyMemberRepository.findByUserWithRelations(userId);

    if (
      !member ||
      member.status !== CompanyMemberStatus.ACTIVE ||
      !member.company ||
      member.company.status !== CompanyStatus.ACTIVE ||
      !member.profile
    ) {
      return null;
    }

    return {
      companyId: member.companyId,
      company: member.company,
      profile: member.profile,
      permissions: member.profile.permissions ?? [],
    };
  }

  /** Conveniência: o contexto já resolvido tem a permissão indicada? */
  static can(
    context: CompanyContext | null,
    permission: CompanyPermission,
  ): boolean {
    return !!context?.permissions?.includes(permission);
  }
}
