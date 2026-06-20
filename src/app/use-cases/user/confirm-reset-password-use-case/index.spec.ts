import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { User } from '../../../../domain/user/user.entity';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { ICryptoService } from '../../../services/interfaces/crypto.interface';
import { SERVICE_TOKENS } from '../../../services/tokens';
import { ConfirmResetPasswordUseCase } from '.';

describe('ConfirmResetPasswordUseCase', () => {
  let useCase: ConfirmResetPasswordUseCase;
  const userRepositoryMock = mock<IUserRepository>();
  const cryptoServiceMock = mock<ICryptoService>();

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ConfirmResetPasswordUseCase,
        { provide: DOMAIN_TOKENS.USER_REPOSITORY, useValue: userRepositoryMock },
        { provide: SERVICE_TOKENS.CRYPTO_SERVICE, useValue: cryptoServiceMock },
      ],
    }).compile();
    useCase = module.get(ConfirmResetPasswordUseCase);
  });

  const param = { token: 'rtok', password: 'Abcdef1!' };

  it('throws BadRequest for an unknown token', async () => {
    userRepositoryMock.findByResetToken.mockResolvedValue(undefined);
    await expect(useCase.call(param)).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequest when the token expired', async () => {
    userRepositoryMock.findByResetToken.mockResolvedValue({
      id: 'user-id',
      resetToken: 'rtok',
      resetTokenExpiresAt: new Date(Date.now() - 1000),
    } as User);
    await expect(useCase.call(param)).rejects.toThrow(BadRequestException);
  });

  it('sets the new password and clears the reset token', async () => {
    userRepositoryMock.findByResetToken.mockResolvedValue({
      id: 'user-id',
      resetToken: 'rtok',
      resetTokenExpiresAt: new Date(Date.now() + 60_000),
    } as User);
    cryptoServiceMock.hashPassword.mockResolvedValue('hashed');
    userRepositoryMock.update.mockResolvedValue([{ id: 'user-id' } as User]);

    await useCase.call(param);

    expect(userRepositoryMock.update).toHaveBeenCalledWith(
      { id: 'user-id' },
      { password: 'hashed', resetToken: null, resetTokenExpiresAt: null },
    );
  });
});
