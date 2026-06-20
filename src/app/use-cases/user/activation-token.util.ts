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

/** Validade do token de reset de password: 1 hora. */
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export function generateResetToken(): { token: string; expiresAt: Date } {
  return {
    token: randomBytes(32).toString('hex'),
    expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
  };
}

/** Verdadeiro se o token já expirou (ou não tem data de expiração). */
export function isTokenExpired(expiresAt?: Date | null): boolean {
  return !expiresAt || new Date(expiresAt).getTime() <= Date.now();
}
