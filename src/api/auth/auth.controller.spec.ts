import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { LoginUseCase } from '../../app/use-cases/auth/login-use-case';
import { LogoutUseCase } from '../../app/use-cases/auth/logout-use-case';
import { RefreshTokenUseCase } from '../../app/use-cases/auth/refresh-token-use-case';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  let controller: AuthController;
  const login = { call: jest.fn() };
  const refresh = { call: jest.fn() };
  const logout = { call: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: LoginUseCase, useValue: login },
        { provide: RefreshTokenUseCase, useValue: refresh },
        { provide: LogoutUseCase, useValue: logout },
        { provide: JwtService, useValue: {} },
      ],
    }).compile();
    controller = module.get(AuthController);
  });

  it('delegates login', async () => {
    const dto = { email: 'a@b.pt', password: 'x' };
    login.call.mockResolvedValue({ access_token: 'a' });
    const result = await controller.login(dto);
    expect(login.call).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ access_token: 'a' });
  });

  it('delegates refresh', async () => {
    const dto = { refresh_token: 't' };
    await controller.refresh(dto);
    expect(refresh.call).toHaveBeenCalledWith(dto);
  });

  it('returns the JWT payload from the profile endpoint', async () => {
    const payload = { sub: 'user-id', roles: ['ADMIN'] };
    const result = await controller.getProfile({ user: payload } as any);
    expect(result).toEqual(payload);
  });
});
