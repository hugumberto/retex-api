import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUserRoleRepository } from '../../../../domain/user/user-role.repository';
import { UserRole } from '../../../../domain/user/user-roles.entity';
import { User } from '../../../../domain/user/user.entity';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { IUseCase } from '../../interfaces/use-case.interface';
import { AddRoleToUserParamDto } from './add-role-to-user-param.dto';

@Injectable()
export class AddRoleToUserUseCase implements IUseCase<AddRoleToUserParamDto, Omit<User, 'password'>> {
  constructor(
    @Inject(DOMAIN_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(DOMAIN_TOKENS.USER_ROLE_REPOSITORY)
    private readonly userRoleRepository: IUserRoleRepository,
  ) { }

  async call(param: AddRoleToUserParamDto): Promise<Omit<User, 'password'>> {
    const { userId, data } = param;

    // Verificar se usuário existe
    const user = await this.userRepository.findOneWithRelations({ id: userId });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verificar se usuário já possui esta role
    const existingRole = user.roles?.find(userRole => userRole.role === data.role);
    if (existingRole) {
      throw new ConflictException('Usuário já possui esta role');
    }

    // Criar nova role para o usuário
    const newUserRole: Partial<UserRole> = {
      user,
      role: data.role,
    };

    await this.userRoleRepository.create(newUserRole);

    // Buscar usuário atualizado com todas as roles
    const updatedUser = await this.userRepository.findOneWithRelations({ id: userId });

    // Remover senha do retorno
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }
} 