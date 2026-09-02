import { Actor } from '../user-management.policy';
import { AddRoleToUserDto } from './add-role-to-user.dto';

export interface AddRoleToUserParamDto {
  userId: string;
  data: AddRoleToUserDto;
  /** Quem faz o pedido; decide o que pode atribuir e a quem. */
  actor: Actor;
}
