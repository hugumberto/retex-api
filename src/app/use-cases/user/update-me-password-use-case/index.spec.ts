import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { User } from '../../../../domain/user/user.entity';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { ICryptoService } from '../../../services/interfaces/crypto.interface';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { SERVICE_TOKENS } from '../../../services/tokens';
import { UpdateMePasswordUseCase } from '.';

describe('UpdateMePasswordUseCase', () => {
  const repo = mock<IUserRepository>();
  const crypto = mock<ICryptoService>();
  let useCase: UpdateMePasswordUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        UpdateMePasswordUseCase,
        { provide: DOMAIN_TOKENS.USER_REPOSITORY, useValue: repo },
        { provide: SERVICE_TOKENS.CRYPTO_SERVICE, useValue: crypto },
      ],
    }).compile();
    useCase = module.get(UpdateMePasswordUseCase);
  });

  const param = { userId: 'u1', currentPassword: 'old', newPassword: 'newpass' };

  it('throws when the user does not exist', async () => {
    repo.findOne.mockResolvedValue(undefined);
    await expect(useCase.call(param)).rejects.toThrow(NotFoundException);
  });

  it('rejects a wrong current password', async () => {
    repo.findOne.mockResolvedValue({ id: 'u1', password: 'hash' } as User);
    crypto.comparePassword.mockResolvedValue(false);
    await expect(useCase.call(param)).rejects.toThrow(BadRequestException);
  });

  it('updates the password when the current one is correct', async () => {
    repo.findOne.mockResolvedValue({ id: 'u1', password: 'hash' } as User);
    crypto.comparePassword.mockResolvedValue(true);
    crypto.hashPassword.mockResolvedValue('new-hash');
    await useCase.call(param);
    expect(repo.update).toHaveBeenCalledWith(
      { id: 'u1' },
      { password: 'new-hash' },
    );
  });
});
