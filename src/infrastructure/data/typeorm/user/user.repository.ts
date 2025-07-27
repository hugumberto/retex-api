import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    userRepository: Repository<User>,
  ) {
    super(userRepository);
  }
}
