import { CompanyMemberStatus } from '../../../domain/company/company-member.entity';
import { CompanyPermission } from '../../../domain/company/company-profile.entity';
import { ICompanyMemberRepository } from '../../../domain/company/company.repository';

/** A leitura em si, sem exclusões — é esta que vale a pena cachear. */
async function loadManagerEmails(
  companyMemberRepository: ICompanyMemberRepository,
  companyId: string,
): Promise<string[]> {
  const members =
    await companyMemberRepository.findByCompanyWithRelations(companyId);

  return members
    .filter(
      (member) =>
        member.status === CompanyMemberStatus.ACTIVE &&
        member.user?.email &&
        member.profile?.permissions?.includes(
          CompanyPermission.REQUEST_VIEW_ALL,
        ),
    )
    .map((member) => member.user.email);
}

/**
 * Emails dos gestores ativos de uma empresa, para pôr em cópia nas
 * comunicações dirigidas a um colaborador (confirmação e lembrete de recolha).
 *
 * Exclui o próprio destinatário, para o gestor não receber o email duas vezes
 * quando é ele quem faz o pedido.
 */
export async function findCompanyManagerEmails(
  companyMemberRepository: ICompanyMemberRepository,
  companyId: string | null | undefined,
  excludeEmail?: string,
): Promise<string[]> {
  if (!companyId) {
    return [];
  }

  const emails = await loadManagerEmails(companyMemberRepository, companyId);
  return emails.filter((email) => email !== excludeEmail);
}

/**
 * Versão com cache por lote, para quem percorre muitas solicitações de uma vez.
 *
 * Um cron de lembretes com dezenas de solicitações da mesma empresa fazia a
 * mesma leitura de membros dezenas de vezes. Guarda-se a promessa e não o valor
 * resolvido, para duas solicitações da mesma empresa partilharem uma só query
 * mesmo que sejam pedidas em paralelo.
 *
 * O cache vive só enquanto durar o lote — uma alteração de perfil a meio de um
 * cron não tem de se refletir nele.
 */
export function createCompanyManagerEmailsResolver(
  companyMemberRepository: ICompanyMemberRepository,
) {
  const byCompany = new Map<string, Promise<string[]>>();

  return async function resolve(
    companyId: string | null | undefined,
    excludeEmail?: string,
  ): Promise<string[]> {
    if (!companyId) {
      return [];
    }

    let emails = byCompany.get(companyId);
    if (!emails) {
      emails = loadManagerEmails(companyMemberRepository, companyId);
      byCompany.set(companyId, emails);
    }

    return (await emails).filter((email) => email !== excludeEmail);
  };
}
