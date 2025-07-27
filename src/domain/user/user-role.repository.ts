import { IRepository } from '../interfaces/repository.interface';
import { UserRole } from './user-roles.entity';

export interface IUserRoleRepository extends IRepository<UserRole> { } 