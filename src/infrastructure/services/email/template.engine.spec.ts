import * as ptEmail from '../../../i18n/pt/email.json';
import { TemplateEngine } from './template.engine';

/**
 * Tradutor equivalente ao do EmailService, mas ligado directamente ao ficheiro
 * PT. Assim os testes continuam a asserir sobre o texto real e, de caminho,
 * apanham chaves em falta nas traduções.
 */
function makeTranslator(
  messages: Record<string, unknown>,
  template: string,
  lang: string,
) {
  const namespace = messages[template] as Record<string, unknown>;

  return (key: string, args?: Record<string, unknown>): string => {
    const value = key
      .split('.')
      .reduce<unknown>(
        (acc, part) => (acc as Record<string, unknown>)?.[part],
        namespace,
      );

    if (typeof value !== 'string') {
      throw new Error(`chave em falta: email.${template}.${key} (${lang})`);
    }

    return value.replace(/\{(\w+)\}/g, (_, name) => String(args?.[name] ?? ''));
  };
}

function render(
  template: string,
  context: Record<string, unknown>,
  messages: Record<string, unknown> = ptEmail as Record<string, unknown>,
  lang = 'pt',
): string {
  const translate = makeTranslator(messages, template, lang);
  const full = { ...context, lang };

  return new TemplateEngine().render(template, full, (key, args) =>
    translate(key, { ...full, ...args }),
  );
}

describe('TemplateEngine (shared partials)', () => {
  it('renders account-activation through the layout/cta/eyebrow partials', () => {
    const html = render('account-activation', {
      firstName: 'Ana',
      lastName: 'Silva',
      activationUrl: 'https://portal.retex.pt/activate?token=abc',
      year: 2026,
    });

    // layout shell
    expect(html).toContain('https://www.retex.pt/assets/logo.png');
    expect(html).toContain('https://www.retex.pt/assets/logo-white.png');
    expect(html).toContain('&copy;2026 RETEX');
    expect(html).toContain('<html lang="pt">');
    expect(html).toContain('<title>Ative a sua conta Retex</title>');
    // eyebrow partial
    expect(html).toContain('A SUA CONTA ESTÁ A UM PASSO');
    // content context
    expect(html).toContain('Ana');
    expect(html).toContain('Silva');
    // cta partial wiring (url + label). NB: handlebars escapes `=` in the href
    // to `&#x3D;`, exactly as the original templates did — assert the stable prefix.
    expect(html).toContain('href="https://portal.retex.pt/activate?token');
    expect(html).toContain('Ativar conta e definir senha');
  });

  it('renders password-reset with its own CTA label and validity copy', () => {
    const html = render('password-reset', {
      firstName: 'Rui',
      lastName: 'Costa',
      resetUrl: 'https://portal.retex.pt/reset?token=xyz',
      year: 2026,
    });

    expect(html).toContain('REPOR A PALAVRA-PASSE');
    expect(html).toContain('href="https://portal.retex.pt/reset?token');
    expect(html).toContain('Definir nova palavra-passe');
    expect(html).toContain('válido durante 1 hora');
  });

  it('renders out-of-service-zone (no CTA) and honours the optional city', () => {
    const withCity = render('out-of-service-zone', {
      firstName: 'Rui',
      lastName: 'Costa',
      city: 'Porto',
      year: 2026,
    });
    expect(withCity).toContain('OBRIGADO PELO SEU REGISTO');
    expect(withCity).toContain('<strong>Porto</strong>');
    expect(withCity).not.toContain('display:inline-block;background-color:#02748E');

    const withoutCity = render('out-of-service-zone', {
      firstName: 'Rui',
      lastName: 'Costa',
      year: 2026,
    });
    expect(withoutCity).not.toContain('()');
    expect(withoutCity).not.toContain('<strong></strong>');
  });

  it('renders the account-activation email in English when asked', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const en = require('../../../i18n/en/email.json');
    const html = render(
      'account-activation',
      {
        firstName: 'Ana',
        lastName: 'Silva',
        activationUrl: 'https://portal.retex.pt/activate?token=abc',
        year: 2026,
      },
      en,
      'en',
    );

    expect(html).toContain('<html lang="en">');
    expect(html).toContain('<title>Activate your Retex account</title>');
    expect(html).toContain('Activate account and set password');
    expect(html).not.toContain('Ative a sua conta');
  });

  // Rede de segurança das traduções: qualquer chave que um template use e que
  // falte num idioma faz este teste rebentar com o nome da chave.
  it('renders every template in every language without missing keys', () => {
    const fixtures: Record<string, Record<string, unknown>> = {
      'account-activation': { activationUrl: 'https://x.pt/a' },
      'password-reset': { resetUrl: 'https://x.pt/r' },
      'out-of-service-zone': { city: 'Porto' },
      'contact-form': {
        name: 'Ana',
        email: 'a@x.pt',
        phone: '910000000',
        contactTitle: 'Olá',
        message: 'Texto',
      },
      survey: { surveyUrl: 'https://x.pt/s' },
      'collection-cancelled': {
        reason: 'Sem acesso',
        friendlyCode: '2026-000001',
      },
      'collection-confirmation': {
        friendlyCode: '2026-000001',
        collectionDate: '13/05/2026',
        collectionInterval: '09h-12h',
        confirmUrl: 'https://x.pt/c',
        rejectUrl: 'https://x.pt/j',
      },
      'package-confirmation': {
        fullName: 'Ana Silva',
        friendlyCode: '2026-000001',
        statusKey: 'status.CREATED',
        address: {
          street: 'Rua A',
          number: '1',
          city: 'Porto',
          zipCode: '4000-000',
        },
      },
    };

    for (const lang of ['pt', 'en', 'es', 'fr']) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const messages = require(`../../../i18n/${lang}/email.json`);

      for (const [template, context] of Object.entries(fixtures)) {
        const html = render(
          template,
          { firstName: 'Ana', lastName: 'Silva', year: 2026, ...context },
          messages,
          lang,
        );

        expect(html).toContain(`<html lang="${lang}">`);
      }
    }
  });
});
