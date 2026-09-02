import { Actor } from '../user-management.policy';
import { ResetUserPasswordDto } from './reset-user-password.dto';

export interface ResetUserPasswordParamDto {
  data: ResetUserPasswordDto;
  /** Quem faz o pedido; contas ADMIN/MASTER só são repostas por um MASTER. */
  actor: Actor;
}
