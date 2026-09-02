import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { IUserRoleRepository } from '../../../../domain/user/user-role.repository';
import { Role } from '../../../../domain/user/user-roles.entity';
import { User } from '../../../../domain/user/user.entity';
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

  const master = { id: 'master-id', roles: [Role.MASTER] };
  const admin = { id: 'admin-id', roles: [Role.ADMIN] };

  const targetWith = (id: string, roles: Role[]) =>
    ({ id, roles: roles.map((role) => ({ id: `${id}-${role}`, role })) } as User);

  it('throws when the user does not exist', async () => {
    userRepo.findOneWithRelations.mockResolvedValue(undefined);
    await expect(
      useCase.call({ userId: 'u1', data: { roles: [] }, actor: admin }),
    ).rejects.toThrow(NotFoundException);
  });

  it('denies an ADMIN promoting someone to ADMIN', async () => {
    userRepo.findOneWithRelations.mockResolvedValue(
      targetWith('u1', [Role.USER]),
    );
    await expect(
      useCase.call({ userId: 'u1', data: { roles: [Role.ADMIN] }, actor: admin }),
    ).rejects.toThrow(ForbiddenException);
    expect(userRoleRepo.create).not.toHaveBeenCalled();
  });

  it('denies an ADMIN touching the roles of a MASTER', async () => {
    userRepo.findOneWithRelations.mockResolvedValue(
      targetWith('u1', [Role.MASTER]),
    );
    await expect(
      useCase.call({ userId: 'u1', data: { roles: [Role.OPS] }, actor: admin }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('denies a MASTER removing their own MASTER role', async () => {
    userRepo.findOneWithRelations.mockResolvedValue(
      targetWith('master-id', [Role.MASTER]),
    );
    await expect(
      useCase.call({
        userId: 'master-id',
        data: { roles: [Role.ADMIN] },
        actor: master,
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('keeps the roles exactly as sent — ADMIN/MASTER acumulam com as outras', async () => {
    const target = targetWith('u1', [Role.USER, Role.OPS]);
    userRepo.findOneWithRelations.mockResolvedValue(target);
    userRoleRepo.create.mockResolvedValue({} as never);

    await useCase.call({
      userId: 'u1',
      data: { roles: [Role.MASTER, Role.OPS] },
      actor: master,
    });

    // OPS já lá estava e mantém-se; só MASTER é criada.
    expect(userRoleRepo.create).toHaveBeenCalledTimes(1);
    expect(userRoleRepo.create).toHaveBeenCalledWith({
      user: target,
      role: Role.MASTER,
    });
    // Sai apenas USER, que não veio no pedido.
    expect(userRoleRepo.delete).toHaveBeenCalledTimes(1);
  });

  it('lets an ADMIN also be a DRIVER', async () => {
    const target = targetWith('u1', [Role.ADMIN]);
    userRepo.findOneWithRelations.mockResolvedValue(target);
    userRoleRepo.create.mockResolvedValue({} as never);

    await useCase.call({
      userId: 'u1',
      data: { roles: [Role.ADMIN, Role.DRIVER] },
      actor: master,
    });

    expect(userRoleRepo.create).toHaveBeenCalledWith({
      user: target,
      role: Role.DRIVER,
    });
    expect(userRoleRepo.delete).not.toHaveBeenCalled();
  });
});
