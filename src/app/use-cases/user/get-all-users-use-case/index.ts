import { Inject, Injectable } from '@nestjs/common';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { Role } from '../../../../domain/user/user-roles.entity';
import { User } from '../../../../domain/user/user.entity';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { IUseCase } from '../../interfaces/use-case.interface';

export interface GetAllUsersParamDto { role?: Role }

@Injectable()
export class GetAllUsersUseCase implements IUseCase<GetAllUsersParamDto, Omit<User, 'password'>[]> {
  constructor(
    @Inject(DOMAIN_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) { }

  async call(param?: GetAllUsersParamDto): Promise<Omit<User, 'password'>[]> {
    const users = await this.userRepository.findWithRelations({}, { role: param?.role });

    return users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }
} 