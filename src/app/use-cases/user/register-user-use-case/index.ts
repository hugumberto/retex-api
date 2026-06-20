import { randomBytes } from 'crypto';
import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common';
import { IAddressRepository } from '../../../../domain/address/address.repository';
import { IUnitOfWork } from '../../../../domain/interfaces/unit-of-work.interface';
import { ITestZoneRepository } from '../../../../domain/test-zone/test-zone.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUserRoleRepository } from '../../../../domain/user/user-role.repository';
import { Role } from '../../../../domain/user/user-roles.entity';
import { UserStatus } from '../../../../domain/user/user-status.enum';
import { UserType } from '../../../../domain/user/user-type.enum';
import { User } from '../../../../domain/user/user.entity';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { ICryptoService } from '../../../services/interfaces/crypto.interface';
import { IEmailService } from '../../../services/interfaces/email.interface';
import { ISanitizationService } from '../../../services/interfaces/sanitization.interface';
import { SERVICE_TOKENS } from '../../../services/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { buildActivationEmail } from '../activation-email';
import { generateActivationToken } from '../activation-token.util';
import { RegisterUserDto } from './register-user.dto';

type RegisterUserResult = Omit<User, 'password'> & { inServiceZone: boolean };

@Injectable()
export class RegisterUserUseCase implements IUseCase<RegisterUserDto, RegisterUserResult> {
  private readonly logger = new Logger(RegisterUserUseCase.name);

  constructor(
    @Inject(DOMAIN_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(DOMAIN_TOKENS.USER_ROLE_REPOSITORY)
    private readonly userRoleRepository: IUserRoleRepository,
    @Inject(DOMAIN_TOKENS.ADDRESS_REPOSITORY)
    private readonly addressRepository: IAddressRepository,
    @Inject(DOMAIN_TOKENS.TEST_ZONE_REPOSITORY)
    private readonly testZoneRepository: ITestZoneRepository,
    @Inject(DOMAIN_TOKENS.UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
    @Inject(SERVICE_TOKENS.CRYPTO_SERVICE)
    private readonly cryptoService: ICryptoService,
    @Inject(SERVICE_TOKENS.SANITIZATION_SERVICE)
    private readonly sanitizationService: ISanitizationService,
    @Inject(SERVICE_TOKENS.EMAIL_SERVICE)
    private readonly emailService: IEmailService,
  ) { }

  async call(param: RegisterUserDto): Promise<RegisterUserResult> {
    const existing = await this.userRepository.findOne({ email: param.email });
    if (existing) {
      throw new ConflictException('Usuário com este email já existe');
    }

    const rawPassword = param.password ?? randomBytes(16).toString('hex');
    const hashedPassword = await this.cryptoService.hashPassword(rawPassword);

    // Zona de atuação é baseada na cidade: in-zone sse existir uma test_zone para ela.
    const sanitizedCity = this.sanitizationService.sanitizeString(param.address.city ?? '');
    const testZone = await this.testZoneRepository.findByCity(sanitizedCity);
    const isInServiceZone = !!testZone;

    // Só geramos token de ativação para quem já está elegível. Quem está fora
    // recebe o token mais tarde, quando a cidade se tornar zona de atuação.
    const activation = isInServiceZone ? generateActivationToken() : null;

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
        activationToken: activation?.token ?? null,
        activationTokenExpiresAt: activation?.expiresAt ?? null,
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
        lat: this.sanitizationService.sanitizeCoordinate(param.address.lat ?? '0'),
        long: this.sanitizationService.sanitizeCoordinate(param.address.long ?? '0'),
        isDefault: true,
        isInServiceZone,
      });

      return { ...user, roles: [role] } as User;
    });

    // Email transacional (fire-and-forget; não bloqueia a resposta do registo).
    if (isInServiceZone && activation) {
      this.emailService
        .send(buildActivationEmail(result, activation.token))
        .catch((err) =>
          this.logger.error(
            `Falha ao enviar email de ativação para ${result.email}: ${err.message}`,
          ),
        );
    } else {
      this.emailService
        .send({
          to: result.email,
          subject: 'Registo Retex — fora da zona de atuação',
          template: 'out-of-service-zone',
          context: {
            firstName: result.firstName,
            lastName: result.lastName,
            city: param.address.city ?? '',
            year: new Date().getFullYear(),
          },
        })
        .catch((err) =>
          this.logger.error(
            `Falha ao enviar email (fora de zona) para ${result.email}: ${err.message}`,
          ),
        );
    }

    const {
      password,
      activationToken,
      activationTokenExpiresAt,
      ...safeUser
    } = result;
    return { ...safeUser, inServiceZone: isInServiceZone };
  }
}
