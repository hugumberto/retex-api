import { User } from '../user/user.entity';
import { Entity } from '../interfaces/entity.interface';
import { CompanyProfile } from './company-profile.entity';
import { Company } from './company.entity';

export enum CompanyMemberStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

/**
 * Liga um utilizador a uma empresa com um perfil.
 *
 * `userId` é único: um utilizador pertence a no máximo uma empresa. Remover
 * essa restrição no futuro abre a porta a várias sem perder dados.
 */
export interface CompanyMember extends Entity {
  userId: string;
  user?: User;
  companyId: string;
  company?: Company;
  profileId: string;
  profile?: CompanyProfile;
  status: CompanyMemberStatus;
}
