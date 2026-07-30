import { join } from 'path';
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nOptions,
  QueryResolver,
} from 'nestjs-i18n';
import { DEFAULT_LANGUAGE } from './i18n.constants';

/**
 * Resolução do idioma de uma resposta, por ordem de prioridade:
 *   1. `?lang=en` na query (útil para testes e links diretos)
 *   2. header `x-lang`
 *   3. header `Accept-Language` (o que o browser/portal envia)
 * Sem nenhum dos três, responde em português.
 *
 * Nota: a preferência gravada no utilizador (`user.language`) não entra aqui —
 * os resolvers correm antes dos guards, por isso `req.user` ainda não existe.
 * Essa preferência é usada nos emails, que são disparados fora de um pedido.
 */
export function getI18nConfig(): I18nOptions {
  return {
    fallbackLanguage: DEFAULT_LANGUAGE,
    fallbacks: {
      'pt-*': 'pt',
      'en-*': 'en',
      'es-*': 'es',
      'fr-*': 'fr',
    },
    loaderOptions: {
      path: join(__dirname, '..', 'i18n'),
      watch: process.env.NODE_ENV === 'development',
    },
    resolvers: [
      { use: QueryResolver, options: ['lang'] },
      new HeaderResolver(['x-lang']),
      AcceptLanguageResolver,
    ],
  };
}
