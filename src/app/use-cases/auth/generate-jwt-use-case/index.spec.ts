import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { Role } from '../../../../domain/user/user-roles.entity';
import { User } from '../../../../domain/user/user.entity';
import { GenerateJwtUseCase } from '.';

describe('GenerateJwtUseCase', () => {
  const jwtService = mock<JwtService>();
  let useCase: GenerateJwtUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        GenerateJwtUseCase,
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();
    useCase = module.get(GenerateJwtUseCase);
  });

  it('signs a payload with sub/email/roles and returns the user without password', async () => {
    jwtService.sign.mockReturnValue('signed-token');
    const user = {
      id: 'u1', email: 'a@b.pt', password: 'secret',
      roles: [{ role: Role.ADMIN }],
    } as User;

    const result = await useCase.call(user);

    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: 'u1',
      email: 'a@b.pt',
      roles: [Role.ADMIN],
    });
    expect(result.access_token).toBe('signed-token');
    expect(result.user).not.toHaveProperty('password');
  });
});
