import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { DOMAIN_TOKENS } from '../../../domain/tokens';
import { IUserRoleRepository } from '../../../domain/user/user-role.repository';
import { Role } from '../../../domain/user/user-roles.entity';
import { UserStatus } from '../../../domain/user/user-status.enum';
import { User } from '../../../domain/user/user.entity';
import { IUserRepository } from '../../../domain/user/user.repository';
import { ICryptoService } from '../interfaces/crypto.interface';
import { SERVICE_TOKENS } from '../tokens';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  constructor(
    @Inject(DOMAIN_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(DOMAIN_TOKENS.USER_ROLE_REPOSITORY)
    private readonly userRoleRepository: IUserRoleRepository,
    @Inject(SERVICE_TOKENS.CRYPTO_SERVICE)
    private readonly cryptoService: ICryptoService,
  ) {}

  async onApplicationBootstrap() {
    if (process.env.NODE_ENV !== 'development') return;

    const adminEmail = 'admin@retex.pt';
    const existing = await this.userRepository.findOne({ email: adminEmail });
    if (existing) return;

    const hashedPassword = await this.cryptoService.hashPassword('123456');
    const user = await this.userRepository.create({
      firstName: 'Admin',
      lastName: 'Retex',
      email: adminEmail,
      contactPhone: '000000000',
      documentNumber: '000000000',
      password: hashedPassword,
      status: UserStatus.ACTIVE,
    });

    await this.userRoleRepository.create({ user: user as User, role: Role.ADMIN });
  }
}
