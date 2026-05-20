import { Inject, Injectable } from '@nestjs/common';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { User } from '../../../../domain/user/user.entity';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { IUseCase } from '../../interfaces/use-case.interface';

@Injectable()
export class GetSubUsersUseCase implements IUseCase<string, Omit<User, 'password'>[]> {
  constructor(
    @Inject(DOMAIN_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) { }

  async call(parentId: string): Promise<Omit<User, 'password'>[]> {
    const subUsers = await this.userRepository.find({ parentId });
    return subUsers.map(({ password, ...rest }) => rest);
  }
}
