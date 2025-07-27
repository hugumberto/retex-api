import { Inject, Injectable } from '@nestjs/common';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUserRoleRepository } from '../../../../domain/user/user-role.repository';
import { Role } from '../../../../domain/user/user-roles.entity';
import { UserStatus } from '../../../../domain/user/user-status.enum';
import { User } from '../../../../domain/user/user.entity';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { ISanitizationService } from '../../../services/interfaces/sanitization.interface';
import { SERVICE_TOKENS } from '../../../services/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { CreateUserDto } from './create-user.dto';

@Injectable()
export class CreateUserUseCase implements IUseCase<CreateUserDto, User> {
  constructor(
    @Inject(DOMAIN_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(DOMAIN_TOKENS.USER_ROLE_REPOSITORY)
    private readonly userRoleRepository: IUserRoleRepository,
    @Inject(SERVICE_TOKENS.SANITIZATION_SERVICE)
    private readonly sanitizationService: ISanitizationService,
  ) { }

  async call(param: CreateUserDto): Promise<User> {
    const sanitizedDocument = this.sanitizationService.sanitizeNumericString(param.documentNumber);
    const existingUser = await this.userRepository.findOne({ documentNumber: sanitizedDocument });

    if (existingUser) {
      return existingUser;
    }

    let user: Partial<User> = {
      firstName: param.firstName,
      lastName: param.lastName,
      documentNumber: param.documentNumber,
      email: param.email,
      contactPhone: param.contactPhone,
      status: UserStatus.ACTIVE,
    }

    user = await this.userRepository.create(user)

    const role = await this.userRoleRepository.create({
      user: user as User,
      role: Role.USER
    })

    delete role.user;

    return { ...user, roles: [role] } as User;
  }
}
