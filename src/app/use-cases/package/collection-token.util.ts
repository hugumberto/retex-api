import { randomBytes } from 'crypto';

/** Token opaco para o link público de confirmação da coleta. */
export function generateCollectionConfirmationToken(): string {
  return randomBytes(32).toString('hex');
}
