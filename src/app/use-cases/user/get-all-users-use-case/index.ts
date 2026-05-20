import { Inject, Injectable } from '@nestjs/common';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { Role } from '../../../../domain/user/user-roles.entity';
import { User } from '../../../../domain/user/user.entity';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { IUseCase } from '../../interfaces/use-case.interface';

export interface GetAllUsersParamDto { role?: Role; parentId?: string }

@Injectable()
export class GetAllUsersUseCase implements IUseCase<GetAllUsersParamDto, Omit<User, 'password'>[]> {
  constructor(
    @Inject(DOMAIN_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) { }

  async call(param?: GetAllUsersParamDto): Promise<Omit<User, 'password'>[]> {
    const query: Partial<User> = {};
    if (param?.parentId) query.parentId = param.parentId;

    const users = await this.userRepository.findWithRelations(query, { role: param?.role });

    return users.map(({ password, ...rest }) => rest);
  }
} 