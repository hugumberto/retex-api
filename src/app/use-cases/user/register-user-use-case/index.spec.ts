import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { IAddressRepository } from '../../../../domain/address/address.repository';
import { IUnitOfWork } from '../../../../domain/interfaces/unit-of-work.interface';
import { ITestZoneRepository } from '../../../../domain/test-zone/test-zone.repository';
import { Role } from '../../../../domain/user/user-roles.entity';
import { IUserRoleRepository } from '../../../../domain/user/user-role.repository';
import { User } from '../../../../domain/user/user.entity';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { ICryptoService } from '../../../services/interfaces/crypto.interface';
import { IEmailService } from '../../../services/interfaces/email.interface';
import { ISanitizationService } from '../../../services/interfaces/sanitization.interface';
import { SERVICE_TOKENS } from '../../../services/tokens';
import { RegisterUserUseCase } from '.';

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;
  const userRepositoryMock = mock<IUserRepository>();
  const userRoleRepositoryMock = mock<IUserRoleRepository>();
  const addressRepositoryMock = mock<IAddressRepository>();
  const testZoneRepositoryMock = mock<ITestZoneRepository>();
  const cryptoMock = mock<ICryptoService>();
  const sanitizationMock = mock<ISanitizationService>();
  const emailServiceMock = mock<IEmailService>();
  const unitOfWork = mock<IUnitOfWork>();

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        RegisterUserUseCase,
        { provide: DOMAIN_TOKENS.USER_REPOSITORY, useValue: userRepositoryMock },
        { provide: DOMAIN_TOKENS.USER_ROLE_REPOSITORY, useValue: userRoleRepositoryMock },
        { provide: DOMAIN_TOKENS.ADDRESS_REPOSITORY, useValue: addressRepositoryMock },
        { provide: DOMAIN_TOKENS.TEST_ZONE_REPOSITORY, useValue: testZoneRepositoryMock },
        { provide: DOMAIN_TOKENS.UNIT_OF_WORK, useValue: unitOfWork },
        { provide: SERVICE_TOKENS.CRYPTO_SERVICE, useValue: cryptoMock },
        { provide: SERVICE_TOKENS.SANITIZATION_SERVICE, useValue: sanitizationMock },
        { provide: SERVICE_TOKENS.EMAIL_SERVICE, useValue: emailServiceMock },
      ],
    }).compile();
    useCase = module.get(RegisterUserUseCase);

    cryptoMock.hashPassword.mockResolvedValue('hashed');
    sanitizationMock.sanitizeString.mockImplementation((v: string) => v);
    sanitizationMock.sanitizeNumericString.mockReturnValue('1000');
    sanitizationMock.sanitizeCoordinate.mockReturnValue(0);
    unitOfWork.runInTransaction.mockImplementation((work) => work());
    userRepositoryMock.create.mockResolvedValue({
      id: 'user-id', email: 'a@b.pt', firstName: 'A', lastName: 'B',
    } as User);
    userRoleRepositoryMock.create.mockResolvedValue({ role: Role.USER, user: {} } as never);
    addressRepositoryMock.create.mockResolvedValue({} as never);
    emailServiceMock.send.mockResolvedValue(undefined);
  });

  const param = {
    firstName: 'A', lastName: 'B', email: 'a@b.pt', contactPhone: '1',
    address: { street: 'R', number: '1', city: 'Lisboa', zipCode: '1000-001' },
  } as any;

  it('throws Conflict when the email is already registered', async () => {
    userRepositoryMock.findOne.mockResolvedValue({ id: 'x' } as User);
    await expect(useCase.call(param)).rejects.toThrow(ConflictException);
  });

  it('in-zone: marks address in-zone and sends the activation email', async () => {
    userRepositoryMock.findOne.mockResolvedValue(undefined);
    testZoneRepositoryMock.findByCity.mockResolvedValue({ id: 'z', city: 'Lisboa' } as any);

    const result = await useCase.call(param);

    expect(result.inServiceZone).toBe(true);
    expect(addressRepositoryMock.create).toHaveBeenCalledWith(
      expect.objectContaining({ isInServiceZone: true, isDefault: true }),
    );
    expect(emailServiceMock.send).toHaveBeenCalledWith(
      expect.objectContaining({ template: 'account-activation' }),
    );
  });

  it('out-of-zone: sends the out-of-zone notice', async () => {
    userRepositoryMock.findOne.mockResolvedValue(undefined);
    testZoneRepositoryMock.findByCity.mockResolvedValue(null);

    const result = await useCase.call(param);

    expect(result.inServiceZone).toBe(false);
    expect(addressRepositoryMock.create).toHaveBeenCalledWith(
      expect.objectContaining({ isInServiceZone: false }),
    );
    expect(emailServiceMock.send).toHaveBeenCalledWith(
      expect.objectContaining({ template: 'out-of-service-zone' }),
    );
  });
});
