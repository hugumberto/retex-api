import { IRepository } from '../interfaces/repository.interface';
import { Role } from './user-roles.entity';
import { User } from './user.entity';

export interface IUserRepository extends IRepository<User> {
  findOneWithRelations(query: Partial<User>): Promise<User>;
  findWithRelations(query: Partial<User>, options?: { role?: Role }): Promise<User[]>;
}
