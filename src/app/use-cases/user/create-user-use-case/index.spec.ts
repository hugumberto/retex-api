import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { CreateUserUseCase } from '.';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { User } from '../../../../domain/user/user.entity';
import { IUserRepository } from '../../../../domain/user/user.repository';

describe('CreateUserUseCase', () => {
  let createUserUseCase: CreateUserUseCase;
  const userRepositoryMock = mock<IUserRepository>();

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CreateUserUseCase,
        {
          provide: DOMAIN_TOKENS.USER_REPOSITORY,
          useValue: userRepositoryMock,
        },
      ],
    }).compile();

    createUserUseCase = module.get(CreateUserUseCase);
  });

  describe('call', () => {
    it('should return an created user', async () => {
      const user = mock<User>();
      userRepositoryMock.create.mockResolvedValue(user);
      const response = await createUserUseCase.call({
        name: 'John Doe',
        email: 'john@email.com',
      });

      expect(response).toEqual(user);
      expect(userRepositoryMock.create).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@email.com',
      });
    });
  });
});
