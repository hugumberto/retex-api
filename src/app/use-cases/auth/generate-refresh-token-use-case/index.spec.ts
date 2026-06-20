import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { RefreshToken } from '../../../../domain/user/refresh-token.entity';
import { IRefreshTokenRepository } from '../../../../domain/user/refresh-token.repository';
import { User } from '../../../../domain/user/user.entity';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { GenerateRefreshTokenUseCase } from '.';

describe('GenerateRefreshTokenUseCase', () => {
  const repo = mock<IRefreshTokenRepository>();
  let useCase: GenerateRefreshTokenUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        GenerateRefreshTokenUseCase,
        { provide: DOMAIN_TOKENS.REFRESH_TOKEN_REPOSITORY, useValue: repo },
      ],
    }).compile();
    useCase = module.get(GenerateRefreshTokenUseCase);
  });

  it('creates a non-revoked refresh token with a random value', async () => {
    repo.create.mockImplementation(async (dto) => dto as RefreshToken);
    const user = { id: 'u1' } as User;

    await useCase.call(user);

    const arg = repo.create.mock.calls[0][0];
    expect(arg.isRevoked).toBe(false);
    expect(typeof arg.token).toBe('string');
    expect(arg.user).toBe(user);
  });
});
