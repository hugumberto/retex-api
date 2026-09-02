import { Actor } from '../user-management.policy';
import { UpdateUserDto } from './update-user.dto';

export interface UpdateUserParamDto {
  id: string;
  data: UpdateUserDto;
  /** Quem faz o pedido; contas ADMIN/MASTER só são editadas por um MASTER. */
  actor: Actor;
}
