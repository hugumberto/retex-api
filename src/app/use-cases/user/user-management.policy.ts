import { ForbiddenException } from '@nestjs/common';
import {
  isMaster,
  isPrivileged,
  PRIVILEGED_ROLES,
} from '../../../domain/user/role-hierarchy';
import { Role } from '../../../domain/user/user-roles.entity';
import { User } from '../../../domain/user/user.entity';

/**
 * Regra transversal à gestão de utilizadores: contas ADMIN/MASTER só são
 * geridas por um MASTER.
 *
 * O `RolesGuard` já garante que só um ADMIN (ou acima) chega aqui — o que falta
 * é impedir que um ADMIN escale privilégios ou mexa num par/superior: editar,
 * repor a senha, reenviar ativação ou trocar os perfis de um ADMIN/MASTER.
 */

/** Quem faz o pedido. O `id` vem do `sub` do JWT. */
export interface Actor {
  id?: string;
  roles: readonly string[];
}

/**
 * Ator das chamadas internas (criar membro de empresa, por exemplo), em que não
 * há utilizador a pedir e a política não se aplica.
 */
export const SYSTEM_ACTOR: Actor = { roles: [Role.MASTER] };

export const rolesOf = (user: Pick<User, 'roles'> | undefined): Role[] =>
  user?.roles?.map((userRole) => userRole.role) ?? [];

/** A própria conta está sempre acessível ao seu dono (ex.: mudar o telefone). */
const isSelf = (actor: Actor, target: Pick<User, 'id'> | undefined): boolean =>
  !!actor.id && !!target?.id && actor.id === target.id;

/** Lança se o alvo for ADMIN/MASTER e quem age não for MASTER (nem o próprio). */
export const assertCanManageUser = (
  actor: Actor,
  target: Pick<User, 'id' | 'roles'> | undefined,
): void => {
  if (isMaster(actor.roles) || isSelf(actor, target)) return;
  if (isPrivileged(rolesOf(target))) {
    throw new ForbiddenException('errors.auth.masterOnly');
  }
};

/** Lança se algum dos perfis a atribuir for ADMIN/MASTER e quem age não for MASTER. */
export const assertCanAssignRoles = (
  actor: Actor,
  roles: readonly Role[],
): void => {
  if (isMaster(actor.roles)) return;
  if (roles.some((role) => PRIVILEGED_ROLES.includes(role))) {
    throw new ForbiddenException('errors.auth.masterOnly');
  }
};

/**
 * Impede que o próprio MASTER se despromova: sem isto, o último MASTER podia
 * deixar o sistema sem ninguém capaz de gerir admins.
 */
export const assertNotSelfDemotion = (
  actor: Actor,
  targetId: string,
  newRoles: readonly Role[],
): void => {
  if (!isMaster(actor.roles)) return;
  if (actor.id !== targetId) return;
  if (!newRoles.includes(Role.MASTER)) {
    throw new ForbiddenException('errors.auth.cannotDemoteSelf');
  }
};
