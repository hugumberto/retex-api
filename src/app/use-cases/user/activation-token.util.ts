import { randomBytes } from 'crypto';
import { User } from '../../../domain/user/user.entity';

/** Validade do token de ativação: 7 dias. */
export const ACTIVATION_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function generateActivationToken(): { token: string; expiresAt: Date } {
  return {
    token: randomBytes(32).toString('hex'),
    expiresAt: new Date(Date.now() + ACTIVATION_TOKEN_TTL_MS),
  };
}

export function isActivationTokenValid(user: Pick<User, 'activationToken' | 'activationTokenExpiresAt'>): boolean {
  return (
    !!user.activationToken &&
    !!user.activationTokenExpiresAt &&
    new Date(user.activationTokenExpiresAt).getTime() > Date.now()
  );
}
