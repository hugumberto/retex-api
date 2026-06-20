import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { User } from '../../../../domain/user/user.entity';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { GetAllUsersUseCase } from '.';

describe('GetAllUsersUseCase', () => {
  const repo = mock<IUserRepository>();
  let useCase: GetAllUsersUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        GetAllUsersUseCase,
        { provide: DOMAIN_TOKENS.USER_REPOSITORY, useValue: repo },
      ],
    }).compile();
    useCase = module.get(GetAllUsersUseCase);
  });

  it('returns users without the password field', async () => {
    repo.findWithRelations.mockResolvedValue([
      { id: 'u1', email: 'a@b.pt', password: 'secret' } as User,
    ]);
    const result = await useCase.call();
    expect(result[0]).not.toHaveProperty('password');
    expect(result[0]).toMatchObject({ id: 'u1', email: 'a@b.pt' });
  });
});
