import * as fs from 'fs';
import * as handlebars from 'handlebars';
import * as path from 'path';

export class TemplateEngine {
  private readonly templatesDir = path.join(__dirname, 'templates');

  render(template: string, context: Record<string, unknown>): string {
    const filePath = path.join(this.templatesDir, `${template}.hbs`);
    const source = fs.readFileSync(filePath, 'utf-8');
    const compiled = handlebars.compile(source);
    return compiled(context);
  }
}
