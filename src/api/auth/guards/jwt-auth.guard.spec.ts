import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { mock } from 'jest-mock-extended';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  const jwtService = mock<JwtService>();
  const reflector = mock<Reflector>();
  let guard: JwtAuthGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new JwtAuthGuard(jwtService, reflector);
  });

  const contextWith = (authorization?: string) => {
    const request: { headers: { authorization?: string }; user?: unknown } = {
      headers: authorization ? { authorization } : {},
    };
    const ctx = {
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
    return { ctx, request };
  };

  it('allows public routes without a token', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const { ctx } = contextWith();
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(jwtService.verify).not.toHaveBeenCalled();
  });

  it('rejects when no token is provided', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const { ctx } = contextWith();
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('rejects an invalid/expired token', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    jwtService.verify.mockImplementation(() => {
      throw new Error('invalid');
    });
    const { ctx } = contextWith('Bearer bad-token');
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('accepts a valid token and sets request.user from the payload', async () => {
    const payload = { sub: 'user-id', email: 'a@b.pt', roles: ['ADMIN'] };
    reflector.getAllAndOverride.mockReturnValue(false);
    jwtService.verify.mockReturnValue(payload as never);
    const { ctx, request } = contextWith('Bearer good-token');

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(request.user).toEqual(payload);
  });
});
