import { NotFoundException } from '@nestjs/common';

/**
 * Vários recursos (rota, solicitação de recolha, unidade de armazenamento) são
 * consultados indistintamente pelo `id` (UUID) ou pelo código amigável
 * (`ano-XXXXXX`) — o código é o que vem impresso nas etiquetas e é lido pelo
 * leitor de QR. Este módulo concentra essa resolução, que antes estava copiada
 * em cada use-case.
 */
export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_REGEX.test(value.trim());
}

/**
 * Devolve o `id` a partir de um identificador que tanto pode ser o UUID como o
 * código amigável. Quando não é UUID, delega a procura em `findByFriendlyCode`.
 *
 * @param notFoundKey chave i18n lançada quando o código não corresponde a nada.
 */
export async function resolveEntityId<T extends { id: string }>(
  identifier: string,
  findByFriendlyCode: (friendlyCode: string) => Promise<T | null | undefined>,
  notFoundKey: string,
): Promise<string> {
  const value = identifier.trim();

  if (isUuid(value)) {
    return value;
  }

  const found = await findByFriendlyCode(value);

  if (!found) {
    throw new NotFoundException(notFoundKey);
  }

  return found.id;
}
