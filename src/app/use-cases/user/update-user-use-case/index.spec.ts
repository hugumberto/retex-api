import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { User } from '../../../../domain/user/user.entity';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { UpdateUserUseCase } from '.';

describe('UpdateUserUseCase', () => {
  const repo = mock<IUserRepository>();
  let useCase: UpdateUserUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        UpdateUserUseCase,
        { provide: DOMAIN_TOKENS.USER_REPOSITORY, useValue: repo },
      ],
    }).compile();
    useCase = module.get(UpdateUserUseCase);
  });

  it('throws when the user does not exist', async () => {
    repo.findOne.mockResolvedValue(undefined);
    await expect(
      useCase.call({ id: 'u1', data: { contactPhone: '9' } } as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects an email already used by another user', async () => {
    repo.findOne
      .mockResolvedValueOnce({ id: 'u1' } as User) // existing user
      .mockResolvedValueOnce({ id: 'other' } as User); // email owner
    await expect(
      useCase.call({ id: 'u1', data: { email: 'taken@b.pt' } } as any),
    ).rejects.toThrow(ConflictException);
  });

  it('updates an existing user', async () => {
    repo.findOne.mockResolvedValue({ id: 'u1' } as User);
    repo.update.mockResolvedValue([{ id: 'u1' } as User]);
    await useCase.call({ id: 'u1', data: { contactPhone: '9' } } as any);
    expect(repo.update).toHaveBeenCalled();
  });
});
