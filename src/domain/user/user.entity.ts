import { Address } from './address.entity';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  contactPhone: string;
  dayOfWeek: string;
  timeOfDay: string;
  nif: string;
  address: Address;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
