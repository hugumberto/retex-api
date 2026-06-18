import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { User } from '../../../../domain/user/user.entity';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { ICryptoService } from '../../../services/interfaces/crypto.interface';
import { SERVICE_TOKENS } from '../../../services/tokens';
import { ResetUserPasswordUseCase } from '.';

describe('ResetUserPasswordUseCase', () => {
  let resetUserPasswordUseCase: ResetUserPasswordUseCase;
  const userRepositoryMock = mock<IUserRepository>();
  const cryptoServiceMock = mock<ICryptoService>();

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        ResetUserPasswordUseCase,
        {
          provide: DOMAIN_TOKENS.USER_REPOSITORY,
          useValue: userRepositoryMock,
        },
        {
          provide: SERVICE_TOKENS.CRYPTO_SERVICE,
          useValue: cryptoServiceMock,
        },
      ],
    }).compile();

    resetUserPasswordUseCase = module.get(ResetUserPasswordUseCase);
  });

  describe('call', () => {
    it('should reset user password and return user without password', async () => {
      const existingUser = {
        id: 'user-id',
        email: 'john@example.com',
      } as User;
      const updatedUser = {
        id: 'user-id',
        email: 'john@example.com',
        password: 'hashed-password',
      } as User;

      userRepositoryMock.findOne.mockResolvedValue(existingUser);
      cryptoServiceMock.hashPassword.mockResolvedValue('hashed-password');
      userRepositoryMock.update.mockResolvedValue([updatedUser]);

      const response = await resetUserPasswordUseCase.call({
        email: 'john@example.com',
        password: 'new-password',
      });

      expect(cryptoServiceMock.hashPassword).toHaveBeenCalledWith(
        'new-password',
      );
      expect(userRepositoryMock.findOne).toHaveBeenCalledWith({
        email: 'john@example.com',
      });
      expect(userRepositoryMock.update).toHaveBeenCalledWith(
        { id: 'user-id' },
        { password: 'hashed-password' },
      );
      expect(response).toEqual({
        id: 'user-id',
        email: 'john@example.com',
      });
    });

    it('should throw not found when user does not exist', async () => {
      userRepositoryMock.findOne.mockResolvedValue(undefined);

      await expect(
        resetUserPasswordUseCase.call({
          email: 'missing@example.com',
          password: 'new-password',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
