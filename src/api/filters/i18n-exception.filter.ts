import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { STATUS_CODES } from 'http';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { normalizeLanguage } from '../../config/i18n.constants';

/** Forma usada quando a mensagem precisa de interpolação: `{ key, args }`. */
interface TranslatableMessage {
  key: string;
  args?: Record<string, unknown>;
}

function isTranslatableMessage(value: unknown): value is TranslatableMessage {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as TranslatableMessage).key === 'string'
  );
}

/**
 * Traduz as mensagens das exceções antes de as devolver ao cliente.
 *
 * Os use-cases lançam a chave (`errors.user.notFound`) em vez do texto, o que
 * mantém os throws legíveis e sem dependências de i18n. Quem traduz é este
 * filtro, já com o idioma do pedido resolvido. Mensagens que não sejam chaves
 * (ex.: as do class-validator) passam intactas.
 */
@Catch(HttpException)
export class I18nExceptionFilter implements ExceptionFilter {
  constructor(private readonly i18n: I18nService) {}

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const payload = exception.getResponse();

    const lang =
      I18nContext.current(host)?.lang ??
      normalizeLanguage(request?.headers?.['accept-language']);

    let rawMessage: unknown;
    let error: string | undefined;

    if (typeof payload === 'string') {
      rawMessage = payload;
    } else if (isTranslatableMessage(payload)) {
      rawMessage = payload;
    } else if (payload && typeof payload === 'object') {
      rawMessage = (payload as Record<string, unknown>).message;
      error = (payload as Record<string, unknown>).error as string | undefined;
    }

    response.status(status).json({
      statusCode: status,
      message: this.translate(rawMessage, lang),
      error: error ?? STATUS_CODES[status],
    });
  }

  private translate(message: unknown, lang: string): unknown {
    if (isTranslatableMessage(message)) {
      return this.i18n.translate(message.key, { lang, args: message.args });
    }

    // Só traduzimos o que é claramente uma chave nossa; o resto (erros de
    // validação do class-validator, mensagens de terceiros) fica como está.
    if (typeof message === 'string' && message.startsWith('errors.')) {
      return this.i18n.translate(message, { lang });
    }

    if (Array.isArray(message)) {
      return message.map((entry) => this.translate(entry, lang));
    }

    return message;
  }
}
