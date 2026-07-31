import { generateFriendlyCode } from '../collection-request-bag/bag.util';

const MAX_ATTEMPTS = 5;

/**
 * Gera um código amigável (`ano-XXXXXX`) garantindo unicidade contra os já
 * existentes. O índice único na coluna é a rede de segurança final.
 *
 * `existsByFriendlyCode` recebe o código candidato e devolve o registo que já o
 * usa (ou nada, se estiver livre) — normalmente um `repository.findOne`.
 */
export async function generateUniqueFriendlyCode(
  existsByFriendlyCode: (code: string) => Promise<unknown>,
): Promise<string> {
  const year = new Date().getFullYear();

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const code = generateFriendlyCode(year);
    const existing = await existsByFriendlyCode(code);
    if (!existing) return code;
  }

  // Fallback improvável: sufixo extra para reduzir a chance de colisão.
  const suffix = Date.now().toString(36).slice(-2).toUpperCase();
  return `${generateFriendlyCode(year)}${suffix}`;
}
