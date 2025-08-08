import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { CreateUserUseCase } from '.';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUserRoleRepository } from '../../../../domain/user/user-role.repository';
import { Role } from '../../../../domain/user/user-roles.entity';
import { UserStatus } from '../../../../domain/user/user-status.enum';
import { User } from '../../../../domain/user/user.entity';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { ICryptoService } from '../../../services/interfaces/crypto.interface';
import { ISanitizationService } from '../../../services/interfaces/sanitization.interface';
import { SERVICE_TOKENS } from '../../../services/tokens';

describe('CreateUserUseCase', () => {
  let createUserUseCase: CreateUserUseCase;
  const userRepositoryMock = mock<IUserRepository>();
  const userRoleRepositoryMock = mock<IUserRoleRepository>();
  const sanitizationServiceMock = mock<ISanitizationService>();
  const cryptoServiceMock = mock<ICryptoService>();

  beforeEach(async () => {
    sanitizationServiceMock.sanitizeNumericString.mockImplementation((v: string) => v.replace(/\D/g, ''));
    cryptoServiceMock.hashPassword.mockResolvedValue('hashed_password');

    const module = await Test.createTestingModule({
      providers: [
        CreateUserUseCase,
        { provide: DOMAIN_TOKENS.USER_REPOSITORY, useValue: userRepositoryMock },
        { provide: DOMAIN_TOKENS.USER_ROLE_REPOSITORY, useValue: userRoleRepositoryMock },
        { provide: SERVICE_TOKENS.SANITIZATION_SERVICE, useValue: sanitizationServiceMock },
        { provide: SERVICE_TOKENS.CRYPTO_SERVICE, useValue: cryptoServiceMock },
      ],
    }).compile();

    createUserUseCase = module.get(CreateUserUseCase);
  });

  describe('call', () => {
    it('should create and return a user with default USER role', async () => {
      const createdUser = mock<User>();
      createdUser.status = UserStatus.ACTIVE;
      userRepositoryMock.create.mockResolvedValue(createdUser);
      userRoleRepositoryMock.create.mockResolvedValue({ id: 'role-id', role: Role.USER } as any);

      const response = await createUserUseCase.call({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@email.com',
        contactPhone: '99999999',
        documentNumber: 'ABC-123',
        password: 'secret',
      });

      expect(response).toEqual(
        expect.objectContaining({
          status: UserStatus.ACTIVE,
          roles: [
            expect.objectContaining({ id: 'role-id', role: Role.USER })
          ]
        })
      );
      expect(userRepositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@email.com',
          contactPhone: '99999999',
          documentNumber: '123',
          password: 'hashed_password',
          status: UserStatus.ACTIVE,
        })
      );
    });
  });
});
