import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { GetUserByIdUseCase } from '.';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { User } from '../../../../domain/user/user.entity';
import { IUserRepository } from '../../../../domain/user/user.repository';

describe('GetUserByIdUseCase', () => {
  let getUserByIdUseCase: GetUserByIdUseCase;
  const userRepositoryMock = mock<IUserRepository>();

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GetUserByIdUseCase,
        {
          provide: DOMAIN_TOKENS.USER_REPOSITORY,
          useValue: userRepositoryMock,
        },
      ],
    }).compile();

    getUserByIdUseCase = module.get(GetUserByIdUseCase);
  });

  describe('call', () => {
    it('should return an user', async () => {
      const user = mock<User>();
      userRepositoryMock.findOneWithRelations.mockResolvedValue(user);
      const response = await getUserByIdUseCase.call('id');

      expect(response).toEqual(user);
      expect(userRepositoryMock.findOneWithRelations).toHaveBeenCalledWith({ id: 'id' });
    });
  });
});
