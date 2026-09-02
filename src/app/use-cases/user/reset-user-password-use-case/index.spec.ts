import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { Role } from '../../../../domain/user/user-roles.entity';
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

      userRepositoryMock.findOneWithRelations.mockResolvedValue(existingUser);
      cryptoServiceMock.hashPassword.mockResolvedValue('hashed-password');
      userRepositoryMock.update.mockResolvedValue([updatedUser]);

      const response = await resetUserPasswordUseCase.call({
        data: { email: 'john@example.com', password: 'new-password' },
        actor: { id: 'admin-id', roles: [Role.ADMIN] },
      });

      expect(cryptoServiceMock.hashPassword).toHaveBeenCalledWith(
        'new-password',
      );
      expect(userRepositoryMock.findOneWithRelations).toHaveBeenCalledWith({
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
      userRepositoryMock.findOneWithRelations.mockResolvedValue(undefined);

      await expect(
        resetUserPasswordUseCase.call({
          data: { email: 'missing@example.com', password: 'new-password' },
          actor: { id: 'admin-id', roles: [Role.ADMIN] },
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('denies an ADMIN resetting the password of another ADMIN/MASTER', async () => {
      userRepositoryMock.findOneWithRelations.mockResolvedValue({
        id: 'master-id',
        email: 'master@retex.pt',
        roles: [{ role: Role.MASTER }],
      } as User);

      await expect(
        resetUserPasswordUseCase.call({
          data: { email: 'master@retex.pt', password: 'new-password' },
          actor: { id: 'admin-id', roles: [Role.ADMIN] },
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows a MASTER to reset the password of an ADMIN', async () => {
      const target = {
        id: 'admin-id',
        email: 'admin@retex.pt',
        roles: [{ role: Role.ADMIN }],
      } as User;

      userRepositoryMock.findOneWithRelations.mockResolvedValue(target);
      cryptoServiceMock.hashPassword.mockResolvedValue('hashed-password');
      userRepositoryMock.update.mockResolvedValue([
        { ...target, password: 'hashed-password' } as User,
      ]);

      await expect(
        resetUserPasswordUseCase.call({
          data: { email: 'admin@retex.pt', password: 'new-password' },
          actor: { id: 'master-id', roles: [Role.MASTER] },
        }),
      ).resolves.toMatchObject({ id: 'admin-id' });
    });
  });
});
