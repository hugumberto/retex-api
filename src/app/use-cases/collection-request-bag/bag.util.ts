import { ConflictException } from '@nestjs/common';
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

const MAX_COLLISION_RETRIES = 5;

/**
 * Gera um `friendlyCode` que `isTaken` ainda não reconheça. Tenta o formato
 * padrão; se esgotar as retentativas, cai para um fallback com entropia extra
 * (evita abortar por uma colisão rara). O erro explícito é a salvaguarda final,
 * que na prática nunca dispara.
 */
export async function generateUniqueFriendlyCode(
  year: number,
  isTaken: (code: string) => Promise<boolean> | boolean,
): Promise<string> {
  for (let attempt = 0; attempt < MAX_COLLISION_RETRIES; attempt++) {
    const code = generateFriendlyCode(year);
    if (!(await isTaken(code))) return code;
  }

  for (let attempt = 0; attempt < MAX_COLLISION_RETRIES; attempt++) {
    const code = `${generateFriendlyCode(year)}${randomBytes(2)
      .toString('hex')
      .toUpperCase()}`;
    if (!(await isTaken(code))) return code;
  }

  throw new ConflictException('errors.qrCode.uniqueCodeGenerationFailed');
}
