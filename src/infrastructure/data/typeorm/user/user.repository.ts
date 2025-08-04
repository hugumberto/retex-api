import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { User } from '../../../../domain/user/user.entity';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { BaseRepository } from '../abstraction/base.repository';
import { userSchema } from './user.schema';

@Injectable()
export class UserRepository
  extends BaseRepository<User>
  implements IUserRepository {
  constructor(
    @InjectRepository(userSchema)
    private readonly userRepository: Repository<User>,
  ) {
    super(userRepository);
  }

  async findOneWithRelations(query: Partial<User>): Promise<User> {
    const normalizedQuery = this.normalizeQuery(query);
    return this.userRepository.findOne({
      where: normalizedQuery as FindOptionsWhere<User>,
      relations: ['roles'],
    });
  }
}
