import { IRepository } from '../interfaces/repository.interface';
import { Role } from './user-roles.entity';
import { UserStatus } from './user-status.enum';
import { User } from './user.entity';

export interface IUserRepository extends IRepository<User> {
  findOneWithRelations(query: Partial<User>): Promise<User>;
  findWithRelations(query: Partial<User>, options?: { role?: Role }): Promise<User[]>;
  findInactiveUsersByCity(sanitizedCity: string): Promise<User[]>;
  findByActivationToken(token: string): Promise<User | null>;
  findByResetToken(token: string): Promise<User | null>;

  // Agregações para o dashboard (somente leitura).
  countAll(): Promise<number>;
  countByStatus(status: UserStatus): Promise<number>;
}
