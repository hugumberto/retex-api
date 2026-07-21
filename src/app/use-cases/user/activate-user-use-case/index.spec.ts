import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { Address } from '../../../../domain/address/address.entity';
import { IAddressRepository } from '../../../../domain/address/address.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { UserStatus } from '../../../../domain/user/user-status.enum';
import { User } from '../../../../domain/user/user.entity';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { ICryptoService } from '../../../services/interfaces/crypto.interface';
import { SERVICE_TOKENS } from '../../../services/tokens';
import { ActivateUserUseCase } from '.';

describe('ActivateUserUseCase', () => {
  let useCase: ActivateUserUseCase;
  const userRepositoryMock = mock<IUserRepository>();
  const addressRepositoryMock = mock<IAddressRepository>();
  const cryptoServiceMock = mock<ICryptoService>();

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ActivateUserUseCase,
        { provide: DOMAIN_TOKENS.USER_REPOSITORY, useValue: userRepositoryMock },
        {
          provide: DOMAIN_TOKENS.ADDRESS_REPOSITORY,
          useValue: addressRepositoryMock,
        },
        { provide: SERVICE_TOKENS.CRYPTO_SERVICE, useValue: cryptoServiceMock },
      ],
    }).compile();
    useCase = module.get(ActivateUserUseCase);
  });

  const param = { token: 'tok', password: 'Abcdef1!' };
  const pendingUser = (over: Partial<User> = {}) =>
    ({
      id: 'user-id',
      status: UserStatus.INACTIVE,
      activationToken: 'tok',
      activationTokenExpiresAt: new Date(Date.now() + 60_000),
      ...over,
    } as User);

  const inZone = (v: boolean) => [{ isInServiceZone: v } as Address];

  it('throws NotFound for an unknown token', async () => {
    userRepositoryMock.findByActivationToken.mockResolvedValue(undefined);
    await expect(useCase.call(param)).rejects.toThrow(NotFoundException);
  });

  it('throws Conflict when the account is already active', async () => {
    userRepositoryMock.findByActivationToken.mockResolvedValue(
      pendingUser({ status: UserStatus.ACTIVE }),
    );
    await expect(useCase.call(param)).rejects.toThrow(ConflictException);
  });

  it('throws BadRequest when the token expired', async () => {
    userRepositoryMock.findByActivationToken.mockResolvedValue(
      pendingUser({ activationTokenExpiresAt: new Date(Date.now() - 1000) }),
    );
    await expect(useCase.call(param)).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequest when the address is out of the service zone', async () => {
    userRepositoryMock.findByActivationToken.mockResolvedValue(pendingUser());
    addressRepositoryMock.find.mockResolvedValue(inZone(false));
    await expect(useCase.call(param)).rejects.toThrow(BadRequestException);
  });

  it('activates the account, sets the password and clears the token', async () => {
    userRepositoryMock.findByActivationToken.mockResolvedValue(pendingUser());
    addressRepositoryMock.find.mockResolvedValue(inZone(true));
    cryptoServiceMock.hashPassword.mockResolvedValue('hashed');
    userRepositoryMock.update.mockResolvedValue([
      { id: 'user-id' } as User,
    ]);

    await useCase.call(param);

    expect(userRepositoryMock.update).toHaveBeenCalledWith(
      { id: 'user-id' },
      {
        password: 'hashed',
        status: UserStatus.ACTIVE,
        activationToken: null,
        activationTokenExpiresAt: null,
        activationBypassZone: false,
      },
    );
  });
});
