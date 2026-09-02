import { Actor } from '../user-management.policy';
import { SendActivationEmailDto } from './send-activation-email.dto';

export interface SendActivationEmailParamDto {
  data: SendActivationEmailDto;
  /** Quem faz o pedido; use `SYSTEM_ACTOR` em chamadas internas. */
  actor: Actor;
}
