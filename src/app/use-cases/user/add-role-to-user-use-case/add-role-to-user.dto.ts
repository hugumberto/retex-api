import { IsEnum, IsNotEmpty } from 'class-validator';
import { Role } from '../../../../domain/user/user-roles.entity';

export class AddRoleToUserDto {
  @IsEnum(Role, { message: 'Role deve ser um valor válido' })
  @IsNotEmpty({ message: 'Role é obrigatório' })
  role: Role;
} 