import { Entity } from '../interfaces/entity.interface';
import { Package } from '../package/package.entity';
import { Route } from '../route/route.entity';
import { UserRole } from './user-roles.entity';
import { UserStatus } from './user-status.enum';

export interface User extends Entity {
  firstName: string;
  lastName: string;
  email: string;
  contactPhone: string;
  documentNumber: string;
  status: UserStatus;
  packages?: Package[];
  routes?: Route[];
  roles: UserRole[];
}
