import { Entity } from '../interfaces/entity.interface';
import { BlogCategory } from './blog-category.entity';
import { BlogPostHighlight } from './blog-post-highlight.enum';
import { BlogPostStatus } from './blog-post-status.enum';

export interface BlogPost extends Entity {
  body: string;
  slug: string;
  title: string;
  hero: string; // base64 image
  status: BlogPostStatus;
  highlight: BlogPostHighlight;
  tags: string[];
  // Uma ou duas frases para o cartão do artigo e a descrição no Google.
  summary?: string | null;
  // Texto alternativo da imagem de destaque.
  heroAlt?: string | null;
  categories?: BlogCategory[];
  publishDate?: Date; // nullable - só preenchido quando status muda para PUBLISHED
}
