import { IRepository } from '../interfaces/repository.interface';
import { User } from './user.entity';

export interface IUserRepository extends IRepository<User> {
  findOneWithRelations(query: Partial<User>): Promise<User>;
}
