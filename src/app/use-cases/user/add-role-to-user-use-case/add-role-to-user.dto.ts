import { IsArray, IsEnum } from 'class-validator';
import { Role } from '../../../../domain/user/user-roles.entity';

export class AddRoleToUserDto {
  @IsArray({ message: 'Roles deve ser um array' })
  @IsEnum(Role, { each: true, message: 'Cada role deve ser um valor válido' })
  roles: Role[];
} 