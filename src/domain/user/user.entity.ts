import { Address } from '../address/address.entity';
import { Entity } from '../interfaces/entity.interface';
import { Package } from '../package/package.entity';
import { Route } from '../route/route.entity';
import { UserRole } from './user-roles.entity';
import { Gender } from './gender.enum';
import { UserStatus } from './user-status.enum';
import { UserType } from './user-type.enum';

export interface User extends Entity {
  firstName: string;
  lastName: string;
  email: string;
  contactPhone: string;
  password: string;
  status: UserStatus;
  userType: UserType;
  gender?: Gender;
  dateOfBirth?: Date;
  activationToken?: string | null;
  activationTokenExpiresAt?: Date | null;
  packages?: Package[];
  routes?: Route[];
  roles: UserRole[];
  addresses?: Address[];
}
