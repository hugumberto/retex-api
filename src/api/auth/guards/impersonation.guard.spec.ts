import { ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { mock } from 'jest-mock-extended';
import { Role } from '../../../domain/user/user-roles.entity';
import { User } from '../../../domain/user/user.entity';
import { IUserRepository } from '../../../domain/user/user.repository';
import { IMPERSONATION_HEADER, ImpersonationGuard } from './impersonation.guard';

describe('ImpersonationGuard', () => {
  const userRepository = mock<IUserRepository>();
  let guard: ImpersonationGuard;

  const MASTER = { sub: 'master-id', email: 'master@retex.pt', roles: [Role.MASTER] };
  const ADMIN = { sub: 'admin-id', email: 'admin@retex.pt', roles: [Role.ADMIN] };
  const TARGET_ID = '3f6d5b2e-59a4-4a7f-9f0c-4c8d9a1b2c3d';

  const contextWith = (request: Record<string, unknown>): ExecutionContext =>
    ({
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext);

  const requestAs = (
    user: unknown,
    overrides: Record<string, unknown> = {},
  ) => ({
    method: 'GET',
    originalUrl: '/dashboard/me',
    headers: { [IMPERSONATION_HEADER]: TARGET_ID },
    user,
    ...overrides,
  });

  const customer = {
    id: TARGET_ID,
    email: 'cliente@exemplo.pt',
    roles: [{ role: Role.USER }],
  } as User;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new ImpersonationGuard(userRepository);
  });

  it('lets the request through untouched when there is no header', async () => {
    const request = requestAs(MASTER, { headers: {} });
    await expect(guard.canActivate(contextWith(request))).resolves.toBe(true);
    expect(request.user).toBe(MASTER);
    expect(userRepository.findOneWithRelations).not.toHaveBeenCalled();
  });

  it('swaps the request user for the target', async () => {
    userRepository.findOneWithRelations.mockResolvedValue(customer);
    const request = requestAs(MASTER);

    await expect(guard.canActivate(contextWith(request))).resolves.toBe(true);

    expect(request.user).toEqual({
      sub: TARGET_ID,
      email: 'cliente@exemplo.pt',
      roles: [Role.USER],
    });
    expect(request['impersonation']).toEqual({
      byUserId: 'master-id',
      byEmail: 'master@retex.pt',
      asUserId: TARGET_ID,
    });
  });

  it('denies an ADMIN', async () => {
    await expect(
      guard.canActivate(contextWith(requestAs(ADMIN))),
    ).rejects.toThrow(ForbiddenException);
  });

  it('denies anything that is not a GET', async () => {
    await expect(
      guard.canActivate(contextWith(requestAs(MASTER, { method: 'POST' }))),
    ).rejects.toThrow(ForbiddenException);
    expect(userRepository.findOneWithRelations).not.toHaveBeenCalled();
  });

  it('denies a privileged target', async () => {
    userRepository.findOneWithRelations.mockResolvedValue({
      ...customer,
      roles: [{ role: Role.USER }, { role: Role.ADMIN }],
    } as User);

    await expect(
      guard.canActivate(contextWith(requestAs(MASTER))),
    ).rejects.toThrow(ForbiddenException);
  });

  it('denies a target that is not a customer', async () => {
    userRepository.findOneWithRelations.mockResolvedValue({
      ...customer,
      roles: [{ role: Role.DRIVER }],
    } as User);

    await expect(
      guard.canActivate(contextWith(requestAs(MASTER))),
    ).rejects.toThrow(ForbiddenException);
  });

  it('404s on an unknown or malformed target', async () => {
    await expect(
      guard.canActivate(
        contextWith(requestAs(MASTER, { headers: { [IMPERSONATION_HEADER]: 'nope' } })),
      ),
    ).rejects.toThrow(NotFoundException);

    userRepository.findOneWithRelations.mockResolvedValue(undefined);
    await expect(
      guard.canActivate(contextWith(requestAs(MASTER))),
    ).rejects.toThrow(NotFoundException);
  });
});
