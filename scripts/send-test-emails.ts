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
 *   npx ts-node -r tsconfig-paths/register scripts/send-test-emails.ts <destinatário> [idioma] [--dry] [--inline-assets]
 *
 * `--dry` renderiza tudo e valida as imagens sem enviar nada — vale a pena
 * antes de um envio a sério.
 *
 * `--inline-assets` troca os `src` remotos por anexos `cid:`, lidos do `public/`
 * da landing-page. É a forma de rever arte nova antes de estar publicada: o
 * email por URL mostraria um 404, e o que se quer ver é a peça. Em produção os
 * emails vão sempre por URL, por isso este modo é só para revisão.
 *
 * Variáveis: SMTP_*, ASSETS_BASE_URL para escolher de onde vêm as imagens, e
 * ASSETS_LOCAL_DIR para o `public/` que alimenta o `--inline-assets`.
 */
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as nodemailer from 'nodemailer';
import * as path from 'path';
import { TemplateEngine } from '../src/infrastructure/services/email/template.engine';
import {
  normalizeLanguage,
  SupportedLanguage,
} from '../src/config/i18n.constants';

dotenv.config();

/** `public/` da landing-page — é de lá que saem os assets dos emails. */
const ASSETS_LOCAL_DIR =
  process.env.ASSETS_LOCAL_DIR ??
  path.resolve(__dirname, '../../retex-web/packages/landing-page/public');

/**
 * Substitui cada `src` que aponte para `base` por um `cid:` e devolve os anexos
 * correspondentes. Um ficheiro usado duas vezes (a mesma imagem no corpo e no
 * rodapé) vai anexado uma só vez.
 */
function inlineAssets(
  html: string,
  base: string,
): { html: string; attachments: nodemailer.SendMailOptions['attachments'] } {
  const cids = new Map<string, string>();
  const attachments: { filename: string; path: string; cid: string }[] = [];

  const inlined = html.replace(/src="([^"]+)"/g, (original, url: string) => {
    if (!url.startsWith(base)) return original;

    const relative = url.slice(base.length).replace(/^\/+/, '');
    const file = path.join(ASSETS_LOCAL_DIR, decodeURIComponent(relative));

    if (!fs.existsSync(file)) {
      throw new Error(`asset local em falta: ${relative} (${file})`);
    }

    let cid = cids.get(file);
    if (!cid) {
      cid = `asset-${cids.size + 1}@retex`;
      cids.set(file, cid);
      attachments.push({ filename: path.basename(file), path: file, cid });
    }

    return `src="cid:${cid}"`;
  });

  return { html: inlined, attachments };
}

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
  const inline = args.includes('--inline-assets');
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
  if (inline) console.log(`anexos:       inline a partir de ${ASSETS_LOCAL_DIR}`);
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

      // Corre também em `--dry`: é aqui que se apanha um ficheiro em falta no
      // `public/`, que é metade da razão para simular antes de enviar.
      const corpo = inline
        ? inlineAssets(html, process.env.ASSETS_BASE_URL ?? 'https://retex.pt')
        : { html, attachments: undefined };

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
        html: corpo.html,
        ...(corpo.attachments ? { attachments: corpo.attachments } : {}),
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
