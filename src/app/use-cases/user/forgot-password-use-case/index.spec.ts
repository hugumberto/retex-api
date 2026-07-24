import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { User } from '../../../../domain/user/user.entity';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { IEmailService } from '../../../services/interfaces/email.interface';
import { SERVICE_TOKENS } from '../../../services/tokens';
import { ForgotPasswordUseCase } from '.';

describe('ForgotPasswordUseCase', () => {
  let useCase: ForgotPasswordUseCase;
  const userRepositoryMock = mock<IUserRepository>();
  const emailServiceMock = mock<IEmailService>();

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ForgotPasswordUseCase,
        { provide: DOMAIN_TOKENS.USER_REPOSITORY, useValue: userRepositoryMock },
        { provide: SERVICE_TOKENS.EMAIL_SERVICE, useValue: emailServiceMock },
      ],
    }).compile();
    useCase = module.get(ForgotPasswordUseCase);
  });

  it('does nothing for an unknown email — anti-enumeration', async () => {
    userRepositoryMock.findWithRelations.mockResolvedValue([]);

    const result = await useCase.call({ email: 'ghost@example.com' });

    expect(result).toEqual({ ok: true, outOfZone: false });
    expect(userRepositoryMock.update).not.toHaveBeenCalled();
    expect(emailServiceMock.send).not.toHaveBeenCalled();
  });

  it('stores a reset token and sends the email for an in-zone user', async () => {
    userRepositoryMock.findWithRelations.mockResolvedValue([
      {
        id: 'user-id',
        email: 'john@example.com',
        addresses: [{ isInServiceZone: true }],
      } as User,
    ]);
    emailServiceMock.send.mockResolvedValue(undefined);

    const result = await useCase.call({ email: 'john@example.com' });

    expect(result).toEqual({ ok: true, outOfZone: false });
    expect(userRepositoryMock.update).toHaveBeenCalledTimes(1);
    const [query, data] = userRepositoryMock.update.mock.calls[0];
    expect(query).toEqual({ id: 'user-id' });
    expect(typeof (data as { resetToken?: string }).resetToken).toBe('string');
    expect(emailServiceMock.send).toHaveBeenCalledTimes(1);
  });

  it('does not send a reset when the user is out of the service zone', async () => {
    userRepositoryMock.findWithRelations.mockResolvedValue([
      {
        id: 'user-id',
        email: 'faraway@example.com',
        addresses: [{ isInServiceZone: false }],
      } as User,
    ]);

    const result = await useCase.call({ email: 'faraway@example.com' });

    expect(result).toEqual({ ok: true, outOfZone: true });
    expect(userRepositoryMock.update).not.toHaveBeenCalled();
    expect(emailServiceMock.send).not.toHaveBeenCalled();
  });

  it('treats a user without addresses as eligible (e.g. staff)', async () => {
    userRepositoryMock.findWithRelations.mockResolvedValue([
      { id: 'staff-id', email: 'ops@retex.pt', addresses: [] } as unknown as User,
    ]);
    emailServiceMock.send.mockResolvedValue(undefined);

    const result = await useCase.call({ email: 'ops@retex.pt' });

    expect(result).toEqual({ ok: true, outOfZone: false });
    expect(emailServiceMock.send).toHaveBeenCalledTimes(1);
  });
});
