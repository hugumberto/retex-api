import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { mock } from 'jest-mock-extended';
import { Role } from '../../../domain/user/user-roles.entity';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const reflector = mock<Reflector>();
  let guard: RolesGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new RolesGuard(reflector);
  });

  const contextWithUser = (user: unknown): ExecutionContext =>
    ({
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    } as unknown as ExecutionContext);

  it('allows access when no @Roles metadata is present', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(contextWithUser({ roles: [] }))).toBe(true);
  });

  it('allows access when the user has one of the required roles', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN, Role.OPS]);
    const ctx = contextWithUser({ roles: [Role.OPS] });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('denies access when the user lacks the required roles', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
    const ctx = contextWithUser({ roles: [Role.USER] });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('denies access when there is no authenticated user', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
    const ctx = contextWithUser(undefined);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
