import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUserRoleRepository } from '../../../../domain/user/user-role.repository';
import { Role } from '../../../../domain/user/user-roles.entity';
import { UserStatus } from '../../../../domain/user/user-status.enum';
import { User } from '../../../../domain/user/user.entity';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { ICryptoService } from '../../../services/interfaces/crypto.interface';
import { ISanitizationService } from '../../../services/interfaces/sanitization.interface';
import { SERVICE_TOKENS } from '../../../services/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { CreateSubUserParamDto } from './create-sub-user-param.dto';

@Injectable()
export class CreateSubUserUseCase implements IUseCase<CreateSubUserParamDto, User> {
  constructor(
    @Inject(DOMAIN_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(DOMAIN_TOKENS.USER_ROLE_REPOSITORY)
    private readonly userRoleRepository: IUserRoleRepository,
    @Inject(SERVICE_TOKENS.SANITIZATION_SERVICE)
    private readonly sanitizationService: ISanitizationService,
    @Inject(SERVICE_TOKENS.CRYPTO_SERVICE)
    private readonly cryptoService: ICryptoService,
  ) { }

  async call(param: CreateSubUserParamDto): Promise<User> {
    const { parentId, data } = param;

    const parent = await this.userRepository.findOne({ id: parentId });
    if (!parent) {
      throw new NotFoundException('Usuário pai não encontrado');
    }

    if (parent.parentId) {
      throw new BadRequestException('Sub-usuários não podem criar outros sub-usuários');
    }

    const existingByEmail = await this.userRepository.findOne({ email: data.email });
    if (existingByEmail) {
      throw new ConflictException('Usuário com este email já existe');
    }

    if (data.documentNumber) {
      const sanitizedDocument = this.sanitizationService.sanitizeNumericString(data.documentNumber);
      const existingByDocument = await this.userRepository.findOne({ documentNumber: sanitizedDocument });
      if (existingByDocument) {
        throw new ConflictException('Usuário com este documento já existe');
      }
      data.documentNumber = sanitizedDocument;
    }

    const hashedPassword = await this.cryptoService.hashPassword(data.password);

    let user: Partial<User> = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      contactPhone: data.contactPhone ?? null,
      documentNumber: data.documentNumber ?? null,
      password: hashedPassword,
      status: UserStatus.ACTIVE,
      parentId,
    };

    user = await this.userRepository.create(user);

    const role = await this.userRoleRepository.create({
      user: user as User,
      role: Role.SUB_USER,
    });

    delete role.user;

    return { ...user, roles: [role] } as User;
  }
}
