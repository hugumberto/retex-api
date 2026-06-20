import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { ITestZoneRepository } from '../../../../domain/test-zone/test-zone.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { User } from '../../../../domain/user/user.entity';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { IEmailService } from '../../../services/interfaces/email.interface';
import { ISanitizationService } from '../../../services/interfaces/sanitization.interface';
import { SERVICE_TOKENS } from '../../../services/tokens';
import { NotifyZoneInactiveUsersUseCase } from '.';

describe('NotifyZoneInactiveUsersUseCase', () => {
  let useCase: NotifyZoneInactiveUsersUseCase;
  const testZoneRepositoryMock = mock<ITestZoneRepository>();
  const userRepositoryMock = mock<IUserRepository>();
  const emailServiceMock = mock<IEmailService>();
  const sanitizationMock = mock<ISanitizationService>();

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        NotifyZoneInactiveUsersUseCase,
        { provide: DOMAIN_TOKENS.TEST_ZONE_REPOSITORY, useValue: testZoneRepositoryMock },
        { provide: DOMAIN_TOKENS.USER_REPOSITORY, useValue: userRepositoryMock },
        { provide: SERVICE_TOKENS.EMAIL_SERVICE, useValue: emailServiceMock },
        { provide: SERVICE_TOKENS.SANITIZATION_SERVICE, useValue: sanitizationMock },
      ],
    }).compile();
    useCase = module.get(NotifyZoneInactiveUsersUseCase);
    sanitizationMock.sanitizeString.mockImplementation((v: string) => v);
  });

  it('throws NotFound when the zone does not exist', async () => {
    testZoneRepositoryMock.findOne.mockResolvedValue(null);
    await expect(useCase.call({ zoneId: 'missing' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('emails every inactive user of the zone and returns the count', async () => {
    testZoneRepositoryMock.findOne.mockResolvedValue({ id: 'z', city: 'Lisboa' } as any);
    userRepositoryMock.findInactiveUsersByCity.mockResolvedValue([
      { id: 'u1', email: 'u1@x.pt' } as User,
      { id: 'u2', email: 'u2@x.pt' } as User,
    ]);
    emailServiceMock.send.mockResolvedValue(undefined);

    const result = await useCase.call({ zoneId: 'z' });

    expect(result).toEqual({ notified: 2 });
    expect(userRepositoryMock.update).toHaveBeenCalledTimes(2);
    expect(emailServiceMock.send).toHaveBeenCalledTimes(2);
  });
});
