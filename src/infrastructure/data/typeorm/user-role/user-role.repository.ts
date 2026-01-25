import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ILocalStorageService } from '../../../../app/services/local-storage/local-storage.service';
import { SERVICE_TOKENS } from '../../../../app/services/tokens';
import { IUserRoleRepository } from '../../../../domain/user/user-role.repository';
import { UserRole } from '../../../../domain/user/user-roles.entity';
import { BaseRepository } from '../abstraction/base.repository';
import { userRoleSchema } from './user-role.schema';

@Injectable()
export class UserRoleRepository extends BaseRepository<UserRole> implements IUserRoleRepository {
  constructor(
    @InjectRepository(userRoleSchema)
    userRoleRepository: Repository<UserRole>,
    @Inject(SERVICE_TOKENS.LOCAL_STORAGE_SERVICE)
    localStorageService: ILocalStorageService,
  ) {
    super(userRoleRepository, localStorageService);
  }
} 