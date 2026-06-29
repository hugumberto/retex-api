import { Entity } from '../interfaces/entity.interface';
import { User } from '../user/user.entity';

export interface Address extends Entity {
  userId: string;
  user?: User;
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
