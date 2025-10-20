import { Entity } from '../interfaces/entity.interface';
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
  publishDate?: Date; // nullable - só preenchido quando status muda para PUBLISHED
}
