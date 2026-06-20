import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { UserStatus } from '../../../../domain/user/user-status.enum';
import { User } from '../../../../domain/user/user.entity';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { ICryptoService } from '../../../services/interfaces/crypto.interface';
import { SERVICE_TOKENS } from '../../../services/tokens';
import { ValidateUserUseCase } from '.';

describe('ValidateUserUseCase', () => {
  let validateUserUseCase: ValidateUserUseCase;
  const userRepositoryMock = mock<IUserRepository>();
  const cryptoServiceMock = mock<ICryptoService>();

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ValidateUserUseCase,
        { provide: DOMAIN_TOKENS.USER_REPOSITORY, useValue: userRepositoryMock },
        { provide: SERVICE_TOKENS.CRYPTO_SERVICE, useValue: cryptoServiceMock },
      ],
    }).compile();
    validateUserUseCase = module.get(ValidateUserUseCase);
  });

  const param = { email: 'john@example.com', password: 'secret' };
  const userWith = (status: UserStatus) =>
    ({ id: 'user-id', email: param.email, password: 'hash', status } as User);

  it('returns null when the user does not exist', async () => {
    userRepositoryMock.findOneWithRelations.mockResolvedValue(undefined);
    expect(await validateUserUseCase.call(param)).toBeNull();
  });

  it('returns null when the password is wrong', async () => {
    userRepositoryMock.findOneWithRelations.mockResolvedValue(
      userWith(UserStatus.ACTIVE),
    );
    cryptoServiceMock.comparePassword.mockResolvedValue(false);
    expect(await validateUserUseCase.call(param)).toBeNull();
  });

  it('returns null for an INACTIVE user even with the correct password', async () => {
    userRepositoryMock.findOneWithRelations.mockResolvedValue(
      userWith(UserStatus.INACTIVE),
    );
    cryptoServiceMock.comparePassword.mockResolvedValue(true);
    expect(await validateUserUseCase.call(param)).toBeNull();
  });

  it('returns the user when ACTIVE and password is correct', async () => {
    const user = userWith(UserStatus.ACTIVE);
    userRepositoryMock.findOneWithRelations.mockResolvedValue(user);
    cryptoServiceMock.comparePassword.mockResolvedValue(true);
    expect(await validateUserUseCase.call(param)).toEqual(user);
  });
});
