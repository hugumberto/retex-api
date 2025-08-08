import { Inject, Injectable, NotFoundException } from '@nestjs/common';
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

    // Verificar se usuário existe com roles
    const user = await this.userRepository.findOneWithRelations({ id: userId });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const currentRoles = user.roles?.map((ur) => ur.role) ?? [];
    const incomingRoles = data.roles ?? [];

    // Calcular diferenças
    const rolesToAdd = incomingRoles.filter((role) => !currentRoles.includes(role));
    const rolesToRemove = currentRoles.filter((role) => !incomingRoles.includes(role));

    // Adicionar novas roles
    for (const role of rolesToAdd) {
      const newUserRole: Partial<UserRole> = { user, role };
      await this.userRoleRepository.create(newUserRole);
    }

    // Remover roles não enviadas
    for (const role of rolesToRemove) {
      const userRole = user.roles.find((ur) => ur.role === role);
      if (userRole) {
        await this.userRoleRepository.delete({ id: userRole.id } as Partial<UserRole>);
      }
    }

    // Buscar usuário atualizado com todas as roles
    const updatedUser = await this.userRepository.findOneWithRelations({ id: userId });

    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }
} 