import { SetMetadata } from '@nestjs/common';
import { Role } from '../../../domain/user/user-roles.entity';
import { ROLES_KEY } from '../guards/roles.guard';

export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles); 