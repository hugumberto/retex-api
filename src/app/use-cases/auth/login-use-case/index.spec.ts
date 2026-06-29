import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { User } from '../../../../domain/user/user.entity';
import { GenerateJwtUseCase } from '../generate-jwt-use-case';
import { GenerateRefreshTokenUseCase } from '../generate-refresh-token-use-case';
import { ValidateUserUseCase } from '../validate-user-use-case';
import { LoginUseCase } from '.';

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  const validateUser = { call: jest.fn() };
  const generateJwt = { call: jest.fn() };
  const generateRefresh = { call: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        LoginUseCase,
        { provide: ValidateUserUseCase, useValue: validateUser },
        { provide: GenerateJwtUseCase, useValue: generateJwt },
        { provide: GenerateRefreshTokenUseCase, useValue: generateRefresh },
      ],
    }).compile();
    useCase = module.get(LoginUseCase);
  });

  const param = { email: 'a@b.pt', password: 'secret' };

  it('throws Unauthorized for invalid credentials', async () => {
    validateUser.call.mockResolvedValue(null);
    await expect(useCase.call(param)).rejects.toThrow(UnauthorizedException);
  });

  it('returns access + refresh tokens and the user on success', async () => {
    const user = { id: 'user-id' } as User;
    validateUser.call.mockResolvedValue(user);
    generateJwt.call.mockResolvedValue({ access_token: 'access', user });
    generateRefresh.call.mockResolvedValue({ token: 'refresh' });

    const result = await useCase.call(param);

    expect(generateJwt.call).toHaveBeenCalledWith(user);
    expect(generateRefresh.call).toHaveBeenCalledWith(user);
    expect(result).toEqual({
      access_token: 'access',
      refresh_token: 'refresh',
      user,
    });
  });
});
