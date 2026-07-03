import { randomBytes, randomUUID } from 'crypto';

// Alfabeto sem caracteres ambíguos (sem O/0, I/1) para o código amigável.
const FRIENDLY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const FRIENDLY_LENGTH = 6;

/** Valor aleatório codificado no QR. */
export function generateToken(): string {
  return randomBytes(16).toString('hex');
}

/** Identificador de lote (uma geração). */
export function generateBatchId(): string {
  return randomUUID();
}

/** Código amigável: `ano-XXXXXX` (6 alfanuméricos sem ambíguos). */
export function generateFriendlyCode(year: number): string {
  const bytes = randomBytes(FRIENDLY_LENGTH);
  let code = '';
  for (let i = 0; i < FRIENDLY_LENGTH; i++) {
    code += FRIENDLY_ALPHABET[bytes[i] % FRIENDLY_ALPHABET.length];
  }
  return `${year}-${code}`;
}
