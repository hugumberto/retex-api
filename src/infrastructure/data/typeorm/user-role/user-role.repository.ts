import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUserRoleRepository } from '../../../../domain/user/user-role.repository';
import { UserRole } from '../../../../domain/user/user-roles.entity';
import { BaseRepository } from '../abstraction/base.repository';
import { userRoleSchema } from './user-role.schema';

@Injectable()
export class UserRoleRepository extends BaseRepository<UserRole> implements IUserRoleRepository {
  constructor(
    @InjectRepository(userRoleSchema)
    private readonly userRoleRepository: Repository<UserRole>,
  ) {
    super(userRoleRepository);
  }
} 