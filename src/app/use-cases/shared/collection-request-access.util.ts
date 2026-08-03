import { CollectionRequest } from '../../../domain/collection-request/collection-request.entity';
import { CompanyPermission } from '../../../domain/company/company-profile.entity';
import {
  CompanyContext,
  CompanyContextService,
} from '../../services/company-context/company-context.service';

/**
 * Quem pode ver/mexer numa solicitação, para lá do que o `RolesGuard` sabe.
 *
 * O guard só conhece roles globais e não vê o recurso, por isso a decisão vive
 * aqui. Regra, por ordem:
 *
 * 1. ADMIN/OPS (`isPrivileged`) veem tudo — inalterado.
 * 2. Quem criou a solicitação vê a sua — inalterado para particulares.
 * 3. Um membro de empresa com `REQUEST_VIEW_ALL` (o gestor) vê as da sua
 *    empresa; o colaborador, que não tem essa permissão, só vê as que criou.
 */
export function canAccessCollectionRequest(
  request: CollectionRequest,
  requesterId: string,
  isPrivileged: boolean,
  companyContext: CompanyContext | null,
): boolean {
  if (isPrivileged) {
    return true;
  }

  if (request.user?.id === requesterId) {
    return true;
  }

  return isCompanyWideAccess(
    request,
    companyContext,
    CompanyPermission.REQUEST_VIEW_ALL,
  );
}

/** Idem para cancelar: o gestor cancela as da empresa, o colaborador as suas. */
export function canCancelCollectionRequest(
  request: CollectionRequest,
  requesterId: string,
  isPrivileged: boolean,
  companyContext: CompanyContext | null,
): boolean {
  if (isPrivileged) {
    return true;
  }

  if (request.user?.id === requesterId) {
    return true;
  }

  return isCompanyWideAccess(
    request,
    companyContext,
    CompanyPermission.REQUEST_CANCEL_ALL,
  );
}

function isCompanyWideAccess(
  request: CollectionRequest,
  companyContext: CompanyContext | null,
  permission: CompanyPermission,
): boolean {
  if (!companyContext || !request.companyId) {
    return false;
  }
  if (request.companyId !== companyContext.companyId) {
    return false;
  }
  return CompanyContextService.can(companyContext, permission);
}
