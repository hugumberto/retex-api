import { Address } from './address.entity';
import { UserStatus } from './user-status.enum';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  contactPhone: string;
  dayOfWeek: string;
  timeOfDay: string;
  nif: string;
  status: UserStatus;
  address: Address;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
