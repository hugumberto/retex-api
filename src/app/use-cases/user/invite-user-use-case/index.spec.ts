import { ConflictException, ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUserRoleRepository } from '../../../../domain/user/user-role.repository';
import { Role } from '../../../../domain/user/user-roles.entity';
import { UserStatus } from '../../../../domain/user/user-status.enum';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { ICryptoService } from '../../../services/interfaces/crypto.interface';
import { SERVICE_TOKENS } from '../../../services/tokens';
import { SendActivationEmailUseCase } from '../send-activation-email-use-case';
import { InviteUserUseCase } from '.';

describe('InviteUserUseCase', () => {
  const users = mock<IUserRepository>();
  const roles = mock<IUserRoleRepository>();
  const crypto = mock<ICryptoService>();
  const sendActivation = { call: jest.fn().mockResolvedValue({ ok: true }) };
  let useCase: InviteUserUseCase;
  const admin = { id: 'a1', roles: [Role.ADMIN] };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        InviteUserUseCase,
        { provide: DOMAIN_TOKENS.USER_REPOSITORY, useValue: users },
        { provide: DOMAIN_TOKENS.USER_ROLE_REPOSITORY, useValue: roles },
        { provide: SERVICE_TOKENS.CRYPTO_SERVICE, useValue: crypto },
        { provide: SendActivationEmailUseCase, useValue: sendActivation },
      ],
    }).compile();
    useCase = module.get(InviteUserUseCase);
    crypto.hashPassword.mockResolvedValue('hash');
    users.create.mockImplementation(async (u) => ({ id: 'u1', ...u }) as any);
  });

  it('cria a conta inativa com os perfis e envia a ativação', async () => {
    users.findOne.mockResolvedValue(null);

    await useCase.call({
      data: { firstName: ' Carla ', lastName: 'Mendes', email: 'Carla@Retex.PT', roles: [Role.OPS] },
      actor: admin,
    });

    expect(users.create).toHaveBeenCalledWith(
      expect.objectContaining({ firstName: 'Carla', email: 'carla@retex.pt', status: UserStatus.INACTIVE }),
    );
    expect(roles.create).toHaveBeenCalledWith(expect.objectContaining({ role: Role.OPS }));
    expect(sendActivation.call).toHaveBeenCalledWith({ data: { email: 'carla@retex.pt' }, actor: admin });
  });

  it('recusa email repetido', async () => {
    users.findOne.mockResolvedValue({ id: 'x' } as any);
    await expect(
      useCase.call({ data: { firstName: 'A', lastName: 'B', email: 'a@b.pt', roles: [Role.USER] }, actor: admin }),
    ).rejects.toThrow(ConflictException);
    expect(users.create).not.toHaveBeenCalled();
  });

  it('um ADMIN não convida outro ADMIN', async () => {
    await expect(
      useCase.call({ data: { firstName: 'A', lastName: 'B', email: 'a@b.pt', roles: [Role.ADMIN] }, actor: admin }),
    ).rejects.toThrow(ForbiddenException);
    expect(users.create).not.toHaveBeenCalled();
  });
});
