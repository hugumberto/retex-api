import { Entity } from '../interfaces/entity.interface';
import { Company } from './company.entity';

/**
 * Permissões atribuíveis a um perfil de empresa.
 *
 * Deliberadamente separadas do enum `Role` global: os membros de empresa
 * continuam a ser `Role.USER` para os guards e para o `access-control.ts` do
 * portal, e o perfil é um eixo ortogonal validado dentro dos use-cases.
 */
export enum CompanyPermission {
  REQUEST_CREATE = 'REQUEST_CREATE',
  REQUEST_VIEW_OWN = 'REQUEST_VIEW_OWN',
  REQUEST_VIEW_ALL = 'REQUEST_VIEW_ALL',
  REQUEST_CANCEL_OWN = 'REQUEST_CANCEL_OWN',
  REQUEST_CANCEL_ALL = 'REQUEST_CANCEL_ALL',
  MEMBER_MANAGE = 'MEMBER_MANAGE',
  ADDRESS_MANAGE = 'ADDRESS_MANAGE',
}

/** Chaves dos perfis de sistema, semeados na migração. */
export enum CompanyProfileKey {
  MANAGER = 'MANAGER',
  COLLABORATOR = 'COLLABORATOR',
}

export const SYSTEM_PROFILE_PERMISSIONS: Record<
  CompanyProfileKey,
  CompanyPermission[]
> = {
  [CompanyProfileKey.MANAGER]: Object.values(CompanyPermission),
  [CompanyProfileKey.COLLABORATOR]: [
    CompanyPermission.REQUEST_CREATE,
    CompanyPermission.REQUEST_VIEW_OWN,
    CompanyPermission.REQUEST_CANCEL_OWN,
  ],
};

export interface CompanyProfile extends Entity {
  // `null` = perfil de sistema, partilhado por todas as empresas. Quando
  // preenchido, é um perfil próprio de uma empresa (ainda não exposto na UI,
  // mas o modelo já o suporta).
  companyId?: string | null;
  company?: Company | null;
  key: string;
  name: string;
  permissions: CompanyPermission[];
}
