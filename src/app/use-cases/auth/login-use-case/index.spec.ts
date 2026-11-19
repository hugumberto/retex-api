import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
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
  const userRepository = { touchLastLogin: jest.fn().mockResolvedValue(undefined) };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        LoginUseCase,
        { provide: ValidateUserUseCase, useValue: validateUser },
        { provide: GenerateJwtUseCase, useValue: generateJwt },
        { provide: GenerateRefreshTokenUseCase, useValue: generateRefresh },
        { provide: DOMAIN_TOKENS.USER_REPOSITORY, useValue: userRepository },
      ],
    }).compile();
    useCase = module.get(LoginUseCase);
  });

  const param = { email: 'a@b.pt', password: 'secret' };

  it('throws Unauthorized for invalid credentials', async () => {
    validateUser.call.mockResolvedValue(null);
    await expect(useCase.call(param)).rejects.toThrow(UnauthorizedException);
    expect(userRepository.touchLastLogin).not.toHaveBeenCalled();
  });

  it('entra mesmo que o último acesso não se grave', async () => {
    const user = { id: 'user-id' } as User;
    validateUser.call.mockResolvedValue(user);
    userRepository.touchLastLogin.mockRejectedValueOnce(new Error('db'));
    generateJwt.call.mockResolvedValue({ access_token: 'access', user });
    generateRefresh.call.mockResolvedValue({ token: 'refresh' });

    await expect(useCase.call(param)).resolves.toMatchObject({ access_token: 'access' });
  });

  it('returns access + refresh tokens and the user on success', async () => {
    const user = { id: 'user-id' } as User;
    validateUser.call.mockResolvedValue(user);
    generateJwt.call.mockResolvedValue({ access_token: 'access', user });
    generateRefresh.call.mockResolvedValue({ token: 'refresh' });

    const result = await useCase.call(param);

    expect(userRepository.touchLastLogin).toHaveBeenCalledWith('user-id');
    expect(generateJwt.call).toHaveBeenCalledWith(user);
    expect(generateRefresh.call).toHaveBeenCalledWith(user);
    expect(result).toEqual({
      access_token: 'access',
      refresh_token: 'refresh',
      user,
    });
  });
});
