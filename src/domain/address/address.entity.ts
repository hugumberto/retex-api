import { Entity } from '../interfaces/entity.interface';
import { Company } from '../company/company.entity';
import { User } from '../user/user.entity';

export interface Address extends Entity {
  // Dono da morada: OU um utilizador OU uma empresa, nunca ambos (CHECK na BD).
  // As moradas de empresa são os locais de recolha partilhados pelos membros.
  userId?: string | null;
  user?: User;
  companyId?: string | null;
  company?: Company | null;
  street: string;
  number: string;
  complement?: string;
  city: string;
  // Cidade normalizada (sem acentos, minúsculas) — usada para casar com as
  // zonas de atuação, que também são guardadas normalizadas.
  cityNormalized: string;
  cityDivision: string;
  country: string;
  countryDivision: string;
  zipCode: string;
  lat: number;
  long: number;
  isDefault: boolean;
  isInServiceZone: boolean;
}
