import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { RefreshToken } from '../../../../domain/user/refresh-token.entity';
import { IRefreshTokenRepository } from '../../../../domain/user/refresh-token.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { LogoutUseCase } from '.';

describe('LogoutUseCase', () => {
  const repo = mock<IRefreshTokenRepository>();
  let useCase: LogoutUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        LogoutUseCase,
        { provide: DOMAIN_TOKENS.REFRESH_TOKEN_REPOSITORY, useValue: repo },
      ],
    }).compile();
    useCase = module.get(LogoutUseCase);
  });

  it('throws when the refresh token is unknown', async () => {
    repo.findByToken.mockResolvedValue(null);
    await expect(useCase.call({ refresh_token: 'x' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('revokes the refresh token on logout', async () => {
    repo.findByToken.mockResolvedValue({ id: 'rt1' } as RefreshToken);
    await useCase.call({ refresh_token: 'x' });
    expect(repo.update).toHaveBeenCalledWith(
      { id: 'rt1' },
      expect.objectContaining({ isRevoked: true }),
    );
  });
});
