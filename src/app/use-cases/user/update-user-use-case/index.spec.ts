import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { Role } from '../../../../domain/user/user-roles.entity';
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

  const admin = { id: 'admin-id', roles: [Role.ADMIN] };

  it('throws when the user does not exist', async () => {
    repo.findOneWithRelations.mockResolvedValue(undefined);
    await expect(
      useCase.call({ id: 'u1', data: { contactPhone: '9' }, actor: admin }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects an email already used by another user', async () => {
    repo.findOneWithRelations.mockResolvedValue({ id: 'u1' } as User);
    repo.findOne.mockResolvedValue({ id: 'other' } as User); // dono do email
    await expect(
      useCase.call({ id: 'u1', data: { email: 'taken@b.pt' }, actor: admin }),
    ).rejects.toThrow(ConflictException);
  });

  it('updates an existing user', async () => {
    repo.findOneWithRelations.mockResolvedValue({ id: 'u1' } as User);
    repo.update.mockResolvedValue([{ id: 'u1' } as User]);
    await useCase.call({ id: 'u1', data: { contactPhone: '9' }, actor: admin });
    expect(repo.update).toHaveBeenCalled();
  });

  it('denies an ADMIN editing another ADMIN/MASTER', async () => {
    repo.findOneWithRelations.mockResolvedValue({
      id: 'master-id',
      roles: [{ role: Role.MASTER }],
    } as User);
    await expect(
      useCase.call({
        id: 'master-id',
        data: { contactPhone: '9' },
        actor: admin,
      }),
    ).rejects.toThrow(ForbiddenException);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('lets an ADMIN edit their own account', async () => {
    repo.findOneWithRelations.mockResolvedValue({
      id: 'admin-id',
      roles: [{ role: Role.ADMIN }],
    } as User);
    repo.update.mockResolvedValue([{ id: 'admin-id' } as User]);
    await useCase.call({
      id: 'admin-id',
      data: { contactPhone: '9' },
      actor: admin,
    });
    expect(repo.update).toHaveBeenCalled();
  });
});
