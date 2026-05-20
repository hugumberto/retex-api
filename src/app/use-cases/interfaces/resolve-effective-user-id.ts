import { JwtPayload } from '../../services/interfaces/auth.interface';

export function resolveEffectiveUserId(payload: JwtPayload): string {
  return payload.parentId ?? payload.sub;
}
