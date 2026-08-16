import { ConflictException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { CompanyMemberStatus } from '../../../domain/company/company-member.entity';
import { ICompanyMemberRepository } from '../../../domain/company/company.repository';
import { IUserRoleRepository } from '../../../domain/user/user-role.repository';
import { Role } from '../../../domain/user/user-roles.entity';
import { UserStatus } from '../../../domain/user/user-status.enum';
import { UserType } from '../../../domain/user/user-type.enum';
import { User } from '../../../domain/user/user.entity';
import { IUserRepository } from '../../../domain/user/user.repository';
import { ICryptoService } from '../../services/interfaces/crypto.interface';

export interface ProvisionMemberInput {
  firstName: string;
  lastName: string;
  email: string;
  contactPhone?: string;
  companyId: string;
  profileId: string;
}

export interface ProvisionMemberDeps {
  userRepository: IUserRepository;
  userRoleRepository: IUserRoleRepository;
  companyMemberRepository: ICompanyMemberRepository;
  cryptoService: ICryptoService;
}

/**
 * Cria o utilizador de um membro de empresa e liga-o à empresa com um perfil.
 *
 * Dois pontos deliberados:
 *
 * - O membro fica `INACTIVE` com uma password aleatória que ninguém conhece; a
 *   password real é definida por ele através do email de ativação. O gestor
 *   nunca escolhe a password de outra pessoa.
 * - A role global é `Role.USER`, como qualquer particular. O perfil de empresa
 *   é um eixo à parte — dar-lhe uma role própria faria os guards existentes
 *   (`@Roles(ADMIN, OPS, USER)` em `POST /collection-request`, e o
 *   `access-control.ts` do portal) recusarem-lhe o acesso.
 */
export async function provisionMember(
  input: ProvisionMemberInput,
  deps: ProvisionMemberDeps,
): Promise<User> {
  const existing = await deps.userRepository.findOne({ email: input.email });
  if (existing) {
    throw new ConflictException('errors.user.emailAlreadyExists');
  }

  const throwawayPassword = await deps.cryptoService.hashPassword(
    randomBytes(32).toString('hex'),
  );

  const user = (await deps.userRepository.create({
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    // `contact_phone` é NOT NULL na tabela; vazio é o equivalente a "não
    // informado" para um membro que ainda vai completar o perfil.
    contactPhone: input.contactPhone ?? '',
    password: throwawayPassword,
    status: UserStatus.INACTIVE,
    userType: UserType.COMPANY,
  } as Partial<User>)) as User;

  const role = await deps.userRoleRepository.create({
    user,
    role: Role.USER,
  });
  delete role.user;

  await deps.companyMemberRepository.create({
    userId: user.id,
    companyId: input.companyId,
    profileId: input.profileId,
    status: CompanyMemberStatus.ACTIVE,
  });

  return { ...user, roles: [role] } as User;
}
