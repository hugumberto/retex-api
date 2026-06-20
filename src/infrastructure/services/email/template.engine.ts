import * as fs from 'fs';
import * as handlebars from 'handlebars';
import * as path from 'path';

export class TemplateEngine {
  private readonly templatesDir = path.join(__dirname, 'templates');
  private readonly partialsDir = path.join(this.templatesDir, 'partials');
  private partialsRegistered = false;

  render(template: string, context: Record<string, unknown>): string {
    this.registerPartials();
    const filePath = path.join(this.templatesDir, `${template}.hbs`);
    const source = fs.readFileSync(filePath, 'utf-8');
    const compiled = handlebars.compile(source);
    return compiled(context);
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
