import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { RefreshToken } from '../../../../domain/user/refresh-token.entity';
import { IRefreshTokenRepository } from '../../../../domain/user/refresh-token.repository';
import { GenerateJwtUseCase } from '../generate-jwt-use-case';
import { GenerateRefreshTokenUseCase } from '../generate-refresh-token-use-case';
import { RefreshTokenUseCase } from '.';

describe('RefreshTokenUseCase', () => {
  let useCase: RefreshTokenUseCase;
  const refreshTokenRepositoryMock = mock<IRefreshTokenRepository>();
  const generateJwt = { call: jest.fn() };
  const generateRefresh = { call: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        RefreshTokenUseCase,
        {
          provide: DOMAIN_TOKENS.REFRESH_TOKEN_REPOSITORY,
          useValue: refreshTokenRepositoryMock,
        },
        { provide: GenerateJwtUseCase, useValue: generateJwt },
        { provide: GenerateRefreshTokenUseCase, useValue: generateRefresh },
      ],
    }).compile();
    useCase = module.get(RefreshTokenUseCase);
  });

  const tokenRow = (over: Partial<RefreshToken> = {}) =>
    ({
      id: 'rt-id',
      token: 'old-token',
      user: { id: 'user-id' },
      expiresAt: new Date(Date.now() + 60_000),
      isRevoked: false,
      ...over,
    } as RefreshToken);

  it('rejects an unknown refresh token', async () => {
    refreshTokenRepositoryMock.findByToken.mockResolvedValue(null);
    await expect(
      useCase.call({ refresh_token: 'nope' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects an expired token', async () => {
    refreshTokenRepositoryMock.findByToken.mockResolvedValue(
      tokenRow({ expiresAt: new Date(Date.now() - 1000) }),
    );
    await expect(
      useCase.call({ refresh_token: 'old-token' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects a revoked token', async () => {
    refreshTokenRepositoryMock.findByToken.mockResolvedValue(
      tokenRow({ isRevoked: true }),
    );
    await expect(
      useCase.call({ refresh_token: 'old-token' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rotates the token: revokes the old one and returns new tokens', async () => {
    const row = tokenRow();
    refreshTokenRepositoryMock.findByToken.mockResolvedValue(row);
    refreshTokenRepositoryMock.update.mockResolvedValue([row]);
    generateJwt.call.mockResolvedValue({ access_token: 'new-access' });
    generateRefresh.call.mockResolvedValue({ token: 'new-refresh' });

    const result = await useCase.call({ refresh_token: 'old-token' });

    expect(refreshTokenRepositoryMock.update).toHaveBeenCalledWith(
      { id: 'rt-id' },
      { isRevoked: true },
    );
    expect(generateRefresh.call).toHaveBeenCalledWith(row.user);
    expect(result).toEqual({
      access_token: 'new-access',
      refresh_token: 'new-refresh',
    });
  });
});
