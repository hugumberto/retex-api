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

  it('does nothing (no email, no token) for an unknown email — anti-enumeration', async () => {
    userRepositoryMock.findOne.mockResolvedValue(undefined);

    const result = await useCase.call({ email: 'ghost@example.com' });

    expect(result).toEqual({ ok: true });
    expect(userRepositoryMock.update).not.toHaveBeenCalled();
    expect(emailServiceMock.send).not.toHaveBeenCalled();
  });

  it('stores a reset token and sends the email for a known user', async () => {
    userRepositoryMock.findOne.mockResolvedValue({
      id: 'user-id',
      email: 'john@example.com',
    } as User);
    emailServiceMock.send.mockResolvedValue(undefined);

    const result = await useCase.call({ email: 'john@example.com' });

    expect(result).toEqual({ ok: true });
    expect(userRepositoryMock.update).toHaveBeenCalledTimes(1);
    const [query, data] = userRepositoryMock.update.mock.calls[0];
    expect(query).toEqual({ id: 'user-id' });
    expect(typeof (data as { resetToken?: string }).resetToken).toBe('string');
    expect(emailServiceMock.send).toHaveBeenCalledTimes(1);
  });
});
