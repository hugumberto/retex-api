import { Entity } from '../interfaces/entity.interface';
import { CompanyMember } from './company-member.entity';

export enum CompanyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface Company extends Entity {
  // Nome comercial, usado na listagem e no crachá das solicitações.
  name: string;
  // Razão social, quando difere do nome comercial.
  legalName?: string | null;
  // NIF/VAT. Único — é o identificador fiscal da empresa.
  taxId: string;
  // Contactos gerais da empresa (o gestor tem os seus no `user`).
  email?: string | null;
  phone?: string | null;
  status: CompanyStatus;
  // Código amigável (`ano-XXXXXX`), mesma convenção de rota/solicitação.
  friendlyCode?: string | null;
  members?: CompanyMember[];
}
