import { randomBytes } from 'crypto';
import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { IAddressRepository } from '../../../../domain/address/address.repository';
import { IUnitOfWork } from '../../../../domain/interfaces/unit-of-work.interface';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUserRoleRepository } from '../../../../domain/user/user-role.repository';
import { Role } from '../../../../domain/user/user-roles.entity';
import { UserStatus } from '../../../../domain/user/user-status.enum';
import { UserType } from '../../../../domain/user/user-type.enum';
import { User } from '../../../../domain/user/user.entity';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { ICryptoService } from '../../../services/interfaces/crypto.interface';
import { ISanitizationService } from '../../../services/interfaces/sanitization.interface';
import { SERVICE_TOKENS } from '../../../services/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { RegisterUserDto } from './register-user.dto';

@Injectable()
export class RegisterUserUseCase implements IUseCase<RegisterUserDto, Omit<User, 'password'>> {
  constructor(
    @Inject(DOMAIN_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(DOMAIN_TOKENS.USER_ROLE_REPOSITORY)
    private readonly userRoleRepository: IUserRoleRepository,
    @Inject(DOMAIN_TOKENS.ADDRESS_REPOSITORY)
    private readonly addressRepository: IAddressRepository,
    @Inject(DOMAIN_TOKENS.UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
    @Inject(SERVICE_TOKENS.CRYPTO_SERVICE)
    private readonly cryptoService: ICryptoService,
    @Inject(SERVICE_TOKENS.SANITIZATION_SERVICE)
    private readonly sanitizationService: ISanitizationService,
  ) { }

  async call(param: RegisterUserDto): Promise<Omit<User, 'password'>> {
    const existing = await this.userRepository.findOne({ email: param.email });
    if (existing) {
      throw new ConflictException('Usuário com este email já existe');
    }

    const rawPassword = param.password ?? randomBytes(16).toString('hex');
    const hashedPassword = await this.cryptoService.hashPassword(rawPassword);

    const result = await this.unitOfWork.runInTransaction(async () => {
      let user: Partial<User> = {
        firstName: param.firstName,
        lastName: param.lastName,
        email: param.email,
        contactPhone: param.contactPhone ?? '',
        password: hashedPassword,
        status: UserStatus.INACTIVE,
        userType: UserType.PERSON,
        gender: param.gender,
        dateOfBirth: param.dateOfBirth ? new Date(param.dateOfBirth) : undefined,
      };

      user = await this.userRepository.create(user);

      const role = await this.userRoleRepository.create({
        user: user as User,
        role: Role.USER,
      });
      delete role.user;

      await this.addressRepository.create({
        userId: user.id,
        street: param.address.street,
        number: param.address.number ?? '',
        complement: param.address.complement,
        city: param.address.city ?? '',
        cityDivision: param.address.cityDivision ?? '',
        country: param.address.country ?? '',
        countryDivision: param.address.countryDivision ?? '',
        zipCode: this.sanitizationService.sanitizeNumericString(param.address.zipCode),
        lat: parseFloat(param.address.lat ?? '0'),
        long: parseFloat(param.address.long ?? '0'),
        isDefault: true,
      });

      return { ...user, roles: [role] } as User;
    });

    const { password, ...userWithoutPassword } = result;
    return userWithoutPassword;
  }
}
