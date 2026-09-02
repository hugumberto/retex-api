import { Role } from './user-roles.entity';

/**
 * Hierarquia de perfis: quem tem a chave herda, implicitamente, os valores.
 *
 * Existe para que o MASTER não tenha de ser acrescentado aos ~60 `@Roles(...)`
 * espalhados pelos controllers — e para que não se esqueça um deles no futuro.
 * Só o MASTER herda; os restantes perfis continuam ortogonais entre si (um OPS
 * não é um DRIVER), tal como estava antes.
 */
const ROLE_INHERITANCE: Partial<Record<Role, Role[]>> = {
  [Role.MASTER]: [Role.ADMIN],
};

/**
 * Expande os perfis do utilizador com os que herda (transitivamente).
 *
 * Aceita `string[]` porque é isto que vem no payload do JWT; valores que não
 * pertençam ao enum são descartados.
 */
export const expandRoles = (roles: readonly string[] | undefined): Role[] => {
  const expanded = new Set<Role>();
  const pending = [...(roles ?? [])].filter((role): role is Role =>
    Object.values(Role).includes(role as Role),
  );

  while (pending.length) {
    const role = pending.pop();
    if (expanded.has(role)) continue;
    expanded.add(role);
    pending.push(...(ROLE_INHERITANCE[role] ?? []));
  }

  return [...expanded];
};

/** `true` se os perfis do utilizador satisfazem (herança incluída) algum dos exigidos. */
export const hasAnyRole = (
  userRoles: readonly string[] | undefined,
  required: readonly Role[],
): boolean => {
  const effective = expandRoles(userRoles);
  return required.some((role) => effective.includes(role));
};

/**
 * Perfis cuja gestão é exclusiva do MASTER: só um MASTER pode criar, editar,
 * repor a senha ou mexer nos perfis de um utilizador que os tenha.
 */
export const PRIVILEGED_ROLES: readonly Role[] = [Role.ADMIN, Role.MASTER];

export const isMaster = (roles: readonly string[] | undefined): boolean =>
  (roles ?? []).includes(Role.MASTER);

export const isPrivileged = (roles: readonly Role[] | undefined): boolean =>
  (roles ?? []).some((role) => PRIVILEGED_ROLES.includes(role));
