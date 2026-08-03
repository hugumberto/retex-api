import { CompanyMemberStatus } from '../../../domain/company/company-member.entity';
import { CompanyPermission } from '../../../domain/company/company-profile.entity';
import { ICompanyMemberRepository } from '../../../domain/company/company.repository';

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

  const members =
    await companyMemberRepository.findByCompanyWithRelations(companyId);

  return members
    .filter(
      (member) =>
        member.status === CompanyMemberStatus.ACTIVE &&
        member.user?.email &&
        member.user.email !== excludeEmail &&
        member.profile?.permissions?.includes(
          CompanyPermission.REQUEST_VIEW_ALL,
        ),
    )
    .map((member) => member.user.email);
}
