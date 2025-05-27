import { Inject, Injectable } from '@nestjs/common';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { User } from '../../../../domain/user/user.entity';
import { UserRepository } from '../../../../infrastructure/data/typeorm/user/user.repository';
import { IUseCase } from '../../interfaces/use-case.interface';

@Injectable()
export class GetUserByIdUseCase implements IUseCase<string, User> {
  constructor(
    @Inject(DOMAIN_TOKENS.USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  call(id: string): Promise<User> {
    return this.userRepository.findOne({ id });
  }
}
