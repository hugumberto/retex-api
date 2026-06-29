import { TemplateEngine } from './template.engine';

describe('TemplateEngine (shared partials)', () => {
  const engine = new TemplateEngine();

  it('renders account-activation through the layout/cta/eyebrow partials', () => {
    const html = engine.render('account-activation', {
      firstName: 'Ana',
      lastName: 'Silva',
      activationUrl: 'https://portal.retex.pt/activate?token=abc',
      year: 2026,
    });

    // layout shell
    expect(html).toContain('https://www.retex.pt/assets/logo.png');
    expect(html).toContain('https://www.retex.pt/assets/logo-white.png');
    expect(html).toContain('&copy;2026 RETEX');
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
    const html = engine.render('password-reset', {
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
    const withCity = engine.render('out-of-service-zone', {
      firstName: 'Rui',
      lastName: 'Costa',
      city: 'Porto',
      year: 2026,
    });
    expect(withCity).toContain('OBRIGADO PELO SEU REGISTO');
    expect(withCity).toContain('<strong>Porto</strong>');
    expect(withCity).not.toContain('display:inline-block;background-color:#02748E');

    const withoutCity = engine.render('out-of-service-zone', {
      firstName: 'Rui',
      lastName: 'Costa',
      year: 2026,
    });
    expect(withoutCity).not.toContain('()');
  });
});
