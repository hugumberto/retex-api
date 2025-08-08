import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Role } from '../../../../domain/user/user-roles.entity';
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

  async findWithRelations(query: Partial<User>, options?: { role?: Role }): Promise<User[]> {
    const normalizedQuery = this.normalizeQuery(query);

    const where: any = normalizedQuery;

    if (options?.role) {
      where.roles = { role: options.role };
    }

    return this.userRepository.find({
      where: where as FindOptionsWhere<User>,
      relations: ['roles'],
    });
  }
}
