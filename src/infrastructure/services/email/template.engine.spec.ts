import * as fs from 'fs';
import * as path from 'path';
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

const LANGS = ['pt', 'en', 'es', 'fr'] as const;

function loadMessages(lang: string): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require(`../../../i18n/${lang}/email.json`);
}

/** Contexto mínimo para cada template renderizar sem buracos. */
const FIXTURES: Record<string, Record<string, unknown>> = {
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
  'collection-reminder': {
    friendlyCode: '2026-000001',
    collectionDate: '13/05/2026',
    collectionInterval: '09:00 - 13:00',
    address: {
      street: 'Rua A',
      number: '1',
      city: 'Porto',
      countryDivision: 'Porto',
      zipCode: '4000-000',
    },
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

const baseContext = (context: Record<string, unknown>) => ({
  firstName: 'Ana',
  lastName: 'Silva',
  year: 2026,
  ...context,
});

describe('TemplateEngine (shared partials)', () => {
  it('renders account-activation through the layout/cta/eyebrow partials', () => {
    const html = render('account-activation', {
      firstName: 'Ana',
      lastName: 'Silva',
      activationUrl: 'https://portal.retex.pt/activate?token=abc',
      year: 2026,
    });

    // layout shell
    expect(html).toContain('https://retex.pt/assets/logo.png');
    expect(html).toContain('https://retex.pt/assets/logo-white.png');
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
    for (const lang of LANGS) {
      const messages = loadMessages(lang);

      for (const [template, context] of Object.entries(FIXTURES)) {
        const html = render(template, baseContext(context), messages, lang);

        expect(html).toContain(`<html lang="${lang}">`);
      }
    }
  });

  /**
   * O banner "o que NÃO recolhemos" tem o texto dentro da imagem, por isso a
   * arte é escolhida pelo idioma do destinatário — e há sempre duas versões,
   * porque a desktop fica ilegível num telemóvel. Se algum dos três emails
   * perder o banner, ou apontar para a arte do idioma errado, é aqui que parte.
   */
  it('serve o banner "o que não recolhemos" na arte do idioma e nas duas medidas', () => {
    const comBanner = [
      'package-confirmation',
      'collection-confirmation',
      'collection-reminder',
    ];

    for (const lang of LANGS) {
      const messages = loadMessages(lang);

      for (const template of comBanner) {
        const html = render(
          template,
          baseContext(FIXTURES[template]),
          messages,
          lang,
        );

        expect(html).toContain(
          `https://retex.pt/assets/emails/donts-${lang}.jpg`,
        );
        expect(html).toContain(
          `https://retex.pt/assets/emails/donts-${lang}-mobile.jpg`,
        );
        // A troca desktop/mobile depende destas classes e da media query.
        expect(html).toContain('class="donts-desktop"');
        expect(html).toContain('class="donts-mobile"');
        expect(html).toContain('@media only screen and (max-width: 600px)');
        // Alt traduzido: o texto do banner não existe fora da imagem.
        expect(html).toContain(
          (messages[template] as Record<string, string>).dontsAlt,
        );
      }
    }

    // Os restantes emails não levam o banner.
    const semBanner = Object.keys(FIXTURES).filter(
      (t) => !comBanner.includes(t),
    );
    for (const template of semBanner) {
      const html = render(template, baseContext(FIXTURES[template]));
      expect(html).not.toContain('/assets/emails/donts-');
    }
  });

  /**
   * As imagens dos emails estiveram meses partidas: o template de confirmação
   * apontava para anexos do CDN do Discord, cujos URLs são assinados e
   * expiram. Nenhum teste apanhava isso, por isso só se soube por quem recebeu
   * o email. Todas as imagens têm de sair de `assetsBaseUrl`, que é domínio
   * nosso e servido a partir do site.
   */
  it('não tem imagens presas a domínios externos', () => {
    const templatesDir = path.join(__dirname, 'templates');
    const ficheiros = [
      ...fs.readdirSync(templatesDir),
      ...fs
        .readdirSync(path.join(templatesDir, 'partials'))
        .map((f) => path.join('partials', f)),
    ].filter((f) => f.endsWith('.hbs'));

    expect(ficheiros.length).toBeGreaterThan(0);

    for (const ficheiro of ficheiros) {
      const html = fs.readFileSync(path.join(templatesDir, ficheiro), 'utf-8');
      const externos = [...html.matchAll(/src="(https?:\/\/[^"]+)"/g)].map(
        (m) => m[1],
      );

      expect({ ficheiro, externos }).toEqual({ ficheiro, externos: [] });
    }
  });
});
