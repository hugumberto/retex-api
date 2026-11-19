import { IRepository } from '../interfaces/repository.interface';
import { Role } from './user-roles.entity';
import { UserStatus } from './user-status.enum';
import { User } from './user.entity';

/** Separadores de Utilizadores. */
export type DirectoryKind = 'PERSON' | 'COMPANY' | 'MUNICIPALITY' | 'DRIVER' | 'TEAM';

/** Uma linha de Utilizadores: uma pessoa ou uma entidade (empresa, município…). */
export type DirectoryEntry = {
  kind: DirectoryKind;
  id: string;
  name: string;
  email: string | null;
  taxId: string | null;
  companyKind: string | null;
  // Moradas da entidade ("3 locais").
  locations: number;
  roles: string[];
  plate: string | null;
  city: string | null;
  collections: number;
  deliveredKg: number;
  lastActivityAt: Date | null;
  inRoute: boolean;
  // ACTIVE, INACTIVE ou PENDING_EMAIL (conta à espera da ativação por email).
  status: string;
};

export type DirectoryQuery = { kind?: DirectoryKind; q?: string; limit: number; offset: number };

export type DirectoryPage = {
  data: DirectoryEntry[];
  total: number;
  counts: Record<DirectoryKind | 'ALL', number>;
};

export interface IUserRepository extends IRepository<User> {
  directory(query: DirectoryQuery): Promise<DirectoryPage>;
  touchLastLogin(userId: string): Promise<void>;
  findOneWithRelations(query: Partial<User>): Promise<User>;
  findWithRelations(query: Partial<User>, options?: { role?: Role }): Promise<User[]>;
  findInactiveUsersByCity(sanitizedCity: string): Promise<User[]>;
  findByActivationToken(token: string): Promise<User | null>;
  findByResetToken(token: string): Promise<User | null>;

  // Agregações para o dashboard (somente leitura).
  countAll(): Promise<number>;
  countByStatus(status: UserStatus): Promise<number>;
}
