import { Inject, Injectable } from '@nestjs/common';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { User } from '../../../../domain/user/user.entity';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { IUseCase } from '../../interfaces/use-case.interface';

@Injectable()
export class GetAllUsersUseCase implements IUseCase<void, Omit<User, 'password'>[]> {
  constructor(
    @Inject(DOMAIN_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) { }

  async call(): Promise<Omit<User, 'password'>[]> {
    const users = await this.userRepository.find({});

    // Remover senhas dos resultados
    return users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }
} 