import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { IUserRoleRepository } from '../../../../domain/user/user-role.repository';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { AddRoleToUserUseCase } from '.';

describe('AddRoleToUserUseCase', () => {
  const userRepo = mock<IUserRepository>();
  const userRoleRepo = mock<IUserRoleRepository>();
  let useCase: AddRoleToUserUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AddRoleToUserUseCase,
        { provide: DOMAIN_TOKENS.USER_REPOSITORY, useValue: userRepo },
        { provide: DOMAIN_TOKENS.USER_ROLE_REPOSITORY, useValue: userRoleRepo },
      ],
    }).compile();
    useCase = module.get(AddRoleToUserUseCase);
  });

  it('throws when the user does not exist', async () => {
    userRepo.findOneWithRelations.mockResolvedValue(undefined);
    await expect(
      useCase.call({ userId: 'u1', data: { roles: [] } } as any),
    ).rejects.toThrow(NotFoundException);
  });
});
