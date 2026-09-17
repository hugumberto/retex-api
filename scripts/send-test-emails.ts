/**
 * Envia um exemplar de cada template de email para um único destinatário.
 *
 * Serve para rever as peças numa caixa de correio real — é onde se vê o que
 * nenhum teste apanha: imagens que não carregam, espaçamentos que o cliente de
 * email reescreve, texto cortado no telemóvel.
 *
 * Passa deliberadamente ao lado do `EmailService`: esse grava em `email_log`, e
 * um envio de teste não tem de mexer na base de dados nem de sujar o histórico
 * de emails do cliente. O que é partilhado — e o que interessa validar — é o
 * `TemplateEngine` e os ficheiros de tradução, esses são os mesmos.
 *
 * Uso:
 *   npx ts-node -r tsconfig-paths/register scripts/send-test-emails.ts <destinatário> [idioma] [--dry]
 *
 * `--dry` renderiza tudo e valida as imagens sem enviar nada — vale a pena
 * antes de um envio a sério.
 *
 * Variáveis: SMTP_*, e ASSETS_BASE_URL para escolher de onde vêm as imagens.
 */
import * as dotenv from 'dotenv';
import * as nodemailer from 'nodemailer';
import { TemplateEngine } from '../src/infrastructure/services/email/template.engine';
import {
  normalizeLanguage,
  SupportedLanguage,
} from '../src/config/i18n.constants';

dotenv.config();

/** Contextos plausíveis, equivalentes aos das fixtures dos testes. */
const FIXTURES: Record<string, Record<string, unknown>> = {
  'account-activation': { activationUrl: 'https://retex.pt/auth/activate?token=exemplo' },
  'password-reset': { resetUrl: 'https://retex.pt/auth/reset?token=exemplo' },
  'out-of-service-zone': { city: 'Bragança' },
  'contact-form': {
    name: 'Ana Silva',
    email: 'ana.silva@exemplo.pt',
    phone: '912 345 678',
    contactTitle: 'Dúvida sobre recolhas',
    message: 'Bom dia, gostaria de saber se recolhem no meu concelho.',
  },
  survey: { surveyUrl: 'https://retex.pt/questionario' },
  'collection-cancelled': {
    reason: 'Não foi possível aceder ao local à hora combinada.',
    friendlyCode: '2026-HTE3E8',
  },
  'collection-confirmation': {
    friendlyCode: '2026-HTE3E8',
    collectionDate: '22/09/2026',
    collectionInterval: '09h00 - 12h00',
    confirmUrl: 'https://retex.pt/confirmar-coleta?token=exemplo',
    rejectUrl: 'https://retex.pt/confirmar-coleta?token=exemplo&rejeitar=1',
  },
  'collection-reminder': {
    friendlyCode: '2026-HTE3E8',
    collectionDate: '22/09/2026',
    collectionInterval: '09h00 - 12h00',
    address: {
      street: 'Rua de Santa Catarina',
      number: '128',
      city: 'Porto',
      countryDivision: 'Porto',
      zipCode: '4000-442',
    },
  },
  'package-confirmation': {
    fullName: 'Ana Silva',
    friendlyCode: '2026-HTE3E8',
    statusKey: 'status.CREATED',
    address: {
      street: 'Rua de Santa Catarina',
      number: '128',
      city: 'Porto',
      zipCode: '4000-442',
    },
  },
};

/**
 * Tradutor ligado ao ficheiro do idioma, como no `EmailService` mas sem o Nest.
 * Uma chave em falta rebenta em vez de sair vazia — num email de teste, um
 * espaço em branco passaria despercebido.
 */
function makeTranslator(template: string, lang: SupportedLanguage) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const messages = require(`../src/i18n/${lang}/email.json`);
  const namespace = messages[template] as Record<string, unknown>;

  if (!namespace) {
    throw new Error(`sem traduções para ${template} em ${lang}`);
  }

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

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dry = args.includes('--dry');
  const [recipient, langArg] = args.filter((a) => !a.startsWith('--'));

  if (!recipient) {
    throw new Error(
      'indique o destinatário: ts-node scripts/send-test-emails.ts <email> [idioma]',
    );
  }

  const lang = normalizeLanguage(langArg);
  const engine = new TemplateEngine();

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  console.log(`destinatário: ${recipient}`);
  console.log(`idioma:       ${lang}`);
  console.log(`assets:       ${process.env.ASSETS_BASE_URL ?? '(default)'}`);
  if (dry) console.log('modo:         simulação (não envia)');
  console.log('');

  const templates = Object.keys(FIXTURES).sort();
  let falhas = 0;

  for (const template of templates) {
    const translate = makeTranslator(template, lang);
    const context = {
      firstName: 'Ana',
      lastName: 'Silva',
      year: new Date().getFullYear(),
      ...FIXTURES[template],
    };

    try {
      const html = engine.render(template, { ...context, lang }, translate);
      const subject = `[teste] ${translate('subject')}`;

      // Um `{placeholder}` por substituir sai como texto cru para o cliente.
      const porSubstituir = html.match(/\{[a-zA-Z]+\}/g);
      if (porSubstituir) {
        throw new Error(`variáveis por substituir: ${porSubstituir.join(', ')}`);
      }

      const imagens = [...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map(
        (m) => m[1],
      );
      const externas = imagens.filter(
        (u) => !u.startsWith(process.env.ASSETS_BASE_URL ?? 'https://'),
      );
      if (externas.length) {
        throw new Error(`imagens fora dos assets: ${externas.join(', ')}`);
      }

      if (dry) {
        console.log(
          `  ok       ${template.padEnd(24)} ${imagens.length} imagem(ns)  ${subject}`,
        );
        continue;
      }

      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: recipient,
        subject,
        html,
      });

      console.log(`  enviado  ${template.padEnd(24)} ${subject}`);
    } catch (error) {
      falhas++;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`  FALHOU   ${template.padEnd(24)} ${message}`);
    }
  }

  console.log('');
  const verbo = dry ? 'validados' : 'enviados';
  console.log(`${templates.length - falhas}/${templates.length} ${verbo}`);
  if (falhas > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
