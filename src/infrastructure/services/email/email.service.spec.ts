import { I18nService } from 'nestjs-i18n';
import * as nodemailer from 'nodemailer';
import { mock } from 'jest-mock-extended';
import { IEmailLogRepository } from '../../../domain/email-log/email-log.repository';
import { EmailService } from './email.service';

jest.mock('nodemailer');

describe('EmailService', () => {
  const emailLogRepository = mock<IEmailLogRepository>();
  const i18n = mock<I18nService>();
  const sendMail = jest.fn().mockResolvedValue(undefined);
  let service: EmailService;

  beforeEach(() => {
    jest.clearAllMocks();
    (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail });
    i18n.translate.mockImplementation((key: string) => key as never);
    service = new EmailService(emailLogRepository, i18n);
  });

  // Os valores interpolados nas traduções vêm de dados de utilizador e o helper
  // `{{t}}` devolve SafeString (sem escape), por isso têm de chegar já escapados
  // ao i18n — caso contrário um nome pode injetar HTML no email.
  it('HTML-escapes the values interpolated into translations', async () => {
    await service.send({
      to: 'ana@x.pt',
      template: 'collection-reminder',
      locale: 'pt',
      context: {
        firstName: '<a href="https://phishing.example">clique</a>',
        lastName: "O'Brien & Filhos",
        year: 2026,
        address: { street: '<script>alert(1)</script>' },
      },
    });

    const args = i18n.translate.mock.calls[0][1].args as Record<string, unknown>;

    expect(args.firstName).toBe(
      '&lt;a href=&quot;https://phishing.example&quot;&gt;clique&lt;/a&gt;',
    );
    expect(args.lastName).toBe('O&#39;Brien &amp; Filhos');
    // Escapa também dentro de objetos simples do contexto.
    expect((args.address as Record<string, unknown>).street).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;',
    );
    // Não-strings passam intactos.
    expect(args.year).toBe(2026);
  });

  it('leaves the rendered HTML free of injected markup', async () => {
    // Tradutor realista: devolve markup nosso com o valor interpolado.
    i18n.translate.mockImplementation(
      (key: string, options?: { args?: Record<string, unknown> }) =>
        (key.endsWith('.greeting')
          ? `Olá, <strong>${options?.args?.firstName}</strong>!`
          : key) as never,
    );

    await service.send({
      to: 'ana@x.pt',
      template: 'collection-reminder',
      locale: 'pt',
      context: {
        firstName: '<a href="https://phishing.example">clique</a>',
        lastName: 'Silva',
        year: 2026,
      },
    });

    const { html } = sendMail.mock.calls[0][0];
    // O markup da tradução mantém-se...
    expect(html).toContain('<strong>');
    // ...mas o valor injetado sai neutralizado.
    expect(html).not.toContain('<a href="https://phishing.example">');
    expect(html).toContain('&lt;a href=&quot;https://phishing.example&quot;&gt;');
  });
});
