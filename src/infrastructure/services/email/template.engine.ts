import * as fs from 'fs';
import * as handlebars from 'handlebars';
import * as path from 'path';

/** Resolve uma chave de tradução do namespace do template a ser renderizado. */
export type TemplateTranslator = (
  key: string,
  args?: Record<string, unknown>,
) => string;

export class TemplateEngine {
  private readonly templatesDir = path.join(__dirname, 'templates');
  private readonly partialsDir = path.join(this.templatesDir, 'partials');
  private partialsRegistered = false;

  render(
    template: string,
    context: Record<string, unknown>,
    translate?: TemplateTranslator,
  ): string {
    this.registerPartials();
    this.registerTranslateHelper(translate);

    const filePath = path.join(this.templatesDir, `${template}.hbs`);
    const source = fs.readFileSync(filePath, 'utf-8');
    const compiled = handlebars.compile(source);
    return compiled({ assetsBaseUrl: this.assetsBaseUrl(), ...context });
  }

  // Base URL dos assets dos emails (logo, etc.); configurável via env.
  private assetsBaseUrl(): string {
    const base = process.env.ASSETS_BASE_URL ?? 'https://www.retex.pt';
    return base.replace(/\/+$/, '');
  }

  /**
   * Expõe `{{t "chave"}}` aos templates, já ligado ao idioma deste render.
   * Compilar e executar são operações síncronas, por isso dois envios nunca se
   * atropelam neste helper, apesar de o handlebars o registar globalmente.
   *
   * Sem tradutor (ex.: testes do próprio engine) devolve a chave — chega para
   * validar a estrutura do HTML.
   */
  private registerTranslateHelper(translate?: TemplateTranslator): void {
    handlebars.registerHelper('t', (key: string, options) => {
      const value = translate ? translate(key, options?.hash) : key;
      return new handlebars.SafeString(value);
    });
  }

  // Regista os partials partilhados (layout/header/footer/cta) uma única vez,
  // pelo nome do ficheiro (ex.: `partials/layout.hbs` -> `{{> layout}}`).
  private registerPartials(): void {
    if (this.partialsRegistered) return;
    if (fs.existsSync(this.partialsDir)) {
      for (const file of fs.readdirSync(this.partialsDir)) {
        if (!file.endsWith('.hbs')) continue;
        const name = path.basename(file, '.hbs');
        const source = fs.readFileSync(path.join(this.partialsDir, file), 'utf-8');
        handlebars.registerPartial(name, source);
      }
    }
    this.partialsRegistered = true;
  }
}
