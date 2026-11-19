import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUserRoleRepository } from '../../../../domain/user/user-role.repository';
import { Role } from '../../../../domain/user/user-roles.entity';
import { UserStatus } from '../../../../domain/user/user-status.enum';
import { UserType } from '../../../../domain/user/user-type.enum';
import { User } from '../../../../domain/user/user.entity';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { ICryptoService } from '../../../services/interfaces/crypto.interface';
import { SERVICE_TOKENS } from '../../../services/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { SendActivationEmailUseCase } from '../send-activation-email-use-case';
import { Actor, assertCanAssignRoles } from '../user-management.policy';

export class InviteUserDto {
  @IsString() @IsNotEmpty() @MaxLength(255) firstName: string;
  @IsString() @IsNotEmpty() @MaxLength(255) lastName: string;
  @IsEmail({}, { message: 'Email deve ser válido' }) email: string;
  @IsString() @IsOptional() @MaxLength(20) contactPhone?: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(Role, { each: true })
  roles: Role[];
}

/**
 * Convida uma pessoa: cria a conta sem palavra-passe conhecida, com os perfis
 * escolhidos, e envia o email de ativação para ela a definir. Até ativar, a
 * conta aparece como "Email por confirmar".
 */
@Injectable()
export class InviteUserUseCase
  implements IUseCase<{ data: InviteUserDto; actor: Actor }, Omit<User, 'password'>>
{
  constructor(
    @Inject(DOMAIN_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(DOMAIN_TOKENS.USER_ROLE_REPOSITORY)
    private readonly userRoleRepository: IUserRoleRepository,
    @Inject(SERVICE_TOKENS.CRYPTO_SERVICE)
    private readonly cryptoService: ICryptoService,
    private readonly sendActivationEmailUseCase: SendActivationEmailUseCase,
  ) {}

  async call({ data, actor }: { data: InviteUserDto; actor: Actor }): Promise<Omit<User, 'password'>> {
    const roles = [...new Set(data.roles)];
    // Um ADMIN não convida ADMIN/MASTER (só o MASTER).
    assertCanAssignRoles(actor, roles);

    const email = data.email.trim().toLowerCase();
    if (await this.userRepository.findOne({ email })) {
      throw new ConflictException('errors.user.emailAlreadyExists');
    }

    // Palavra-passe aleatória e nunca comunicada: a pessoa define a sua na ativação.
    const password = await this.cryptoService.hashPassword(randomBytes(24).toString('hex'));
    const user = (await this.userRepository.create({
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email,
      contactPhone: data.contactPhone?.trim() ?? '',
      password,
      status: UserStatus.INACTIVE,
      userType: UserType.PERSON,
    })) as User;

    for (const role of roles) {
      await this.userRoleRepository.create({ user, role });
    }

    await this.sendActivationEmailUseCase.call({ data: { email }, actor });

    const { password: _password, ...rest } = user;
    return { ...rest, roles: roles.map((role) => ({ role })) } as unknown as Omit<User, 'password'>;
  }
}
