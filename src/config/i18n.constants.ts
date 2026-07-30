/** Idiomas suportados pela API (erros e emails). O primeiro é o fallback. */
export const SUPPORTED_LANGUAGES = ['pt', 'en', 'es', 'fr'] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'pt';

/** Locale completo a usar em `toLocaleDateString`/`Intl` por cada idioma. */
export const DATE_LOCALE: Record<SupportedLanguage, string> = {
  pt: 'pt-PT',
  en: 'en-GB',
  es: 'es-ES',
  fr: 'fr-FR',
};

/**
 * Normaliza um idioma vindo do exterior (header, DTO, coluna) para um dos
 * suportados. Aceita variantes regionais ("pt-PT" -> "pt") e cai no default
 * quando não reconhece.
 */
export function normalizeLanguage(value?: string | null): SupportedLanguage {
  if (!value) return DEFAULT_LANGUAGE;
  const base = value.trim().toLowerCase().split(/[-_]/)[0];
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(base)
    ? (base as SupportedLanguage)
    : DEFAULT_LANGUAGE;
}
