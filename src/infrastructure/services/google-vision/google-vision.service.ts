import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IGoogleVisionService } from '../../../app/services/interfaces/google-vision.interface';
import {
  AnalyzeImageResult,
  ClothingColor,
  VisionLabel,
} from '../../../app/use-cases/vision/analyze-image-use-case/analyze-image.dto';

const VISION_URL = 'https://vision.googleapis.com/v1/images:annotate';
const MIN_SCORE = 0.45;
const MIN_COLOR_FRACTION = 0.04;

// ── Clothing taxonomy ─────────────────────────────────────────────────────────

const CLOTHING_TYPES = [
  'shirt', 't-shirt', 'blouse', 'top', 'tank top', 'polo',
  'sweater', 'sweatshirt', 'hoodie', 'pullover', 'turtleneck',
  'jacket', 'coat', 'blazer', 'cardigan', 'vest', 'windbreaker', 'parka',
  'pants', 'trousers', 'jeans', 'shorts', 'leggings', 'chinos', 'joggers',
  'skirt', 'dress', 'gown', 'jumpsuit', 'romper', 'overalls', 'suit',
  'underwear', 'lingerie', 'bra', 'boxer', 'brief',
  'sock', 'tights', 'stocking', 'pantyhose',
  'shoe', 'boot', 'sneaker', 'sandal', 'heel', 'loafer', 'slipper',
  'hat', 'cap', 'beanie', 'beret', 'fedora',
  'scarf', 'glove', 'mitten', 'belt', 'tie', 'bow tie', 'necktie',
  'swimwear', 'bikini', 'swimsuit', 'trunks',
  'uniform', 'sportswear', 'activewear', 'athleisure',
];

const MATERIALS = [
  'cotton', 'denim', 'wool', 'silk', 'linen', 'polyester', 'nylon',
  'leather', 'suede', 'velvet', 'satin', 'chiffon', 'lace', 'mesh',
  'fleece', 'cashmere', 'tweed', 'corduroy', 'spandex', 'lycra', 'rayon',
  'knit', 'woven', 'jersey', 'flannel', 'canvas', 'denim', 'twill',
];

const STYLES = [
  'casual', 'formal', 'elegant', 'sporty', 'athletic', 'vintage', 'retro',
  'streetwear', 'fashion', 'designer', 'luxury', 'classic', 'preppy',
  'bohemian', 'minimalist', 'oversized', 'slim', 'fitted', 'tailored',
];

const PATTERNS = [
  'striped', 'stripes', 'plaid', 'checkered', 'checked', 'gingham',
  'floral', 'print', 'printed', 'graphic', 'tie-dye',
  'solid', 'plain', 'pattern', 'geometric', 'abstract',
  'animal print', 'camouflage', 'camo', 'polka dot', 'houndstooth',
];

// ─────────────────────────────────────────────────────────────────────────────

function matchesAny(text: string, terms: string[]): boolean {
  const lower = text.toLowerCase();
  return terms.some((t) => lower.includes(t));
}

function classify(labels: VisionLabel[]) {
  return {
    types: labels.filter((l) => matchesAny(l.description, CLOTHING_TYPES)),
    materials: labels.filter((l) => matchesAny(l.description, MATERIALS)),
    styles: labels.filter((l) => matchesAny(l.description, STYLES)),
    patterns: labels.filter((l) => matchesAny(l.description, PATTERNS)),
  };
}

function rgbToHex(r = 0, g = 0, b = 0): string {
  return (
    '#' +
    [r, g, b]
      .map((v) => Math.round(v).toString(16).padStart(2, '0'))
      .join('')
  );
}

// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class GoogleVisionService implements IGoogleVisionService {
  private readonly apiKey: string;

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('GOOGLE_VISION_API_KEY')!;
  }

  async analyzeImage(imageBase64: string): Promise<AnalyzeImageResult> {
    try {
      const res = await fetch(`${VISION_URL}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: { content: imageBase64 },
              features: [
                { type: 'LABEL_DETECTION', maxResults: 30 },
                { type: 'OBJECT_LOCALIZATION', maxResults: 20 },
                { type: 'IMAGE_PROPERTIES' },
              ],
            },
          ],
        }),
      });

      if (!res.ok) throw new Error(`Vision API ${res.status}`);

      const data = await res.json();
      const response = data.responses?.[0] ?? {};

      const labels: VisionLabel[] = (response.labelAnnotations ?? [])
        .filter((l: any) => l.score >= MIN_SCORE)
        .map((l: any) => ({ description: l.description as string, score: l.score as number }));

      const objects: VisionLabel[] = (response.localizedObjectAnnotations ?? [])
        .filter((o: any) => o.score >= MIN_SCORE)
        .map((o: any) => ({ description: o.name as string, score: o.score as number }));

      // Merge objects + labels (objects take priority, dedup by description)
      const objectNames = new Set(objects.map((o) => o.description.toLowerCase()));
      const allLabels: VisionLabel[] = [
        ...objects,
        ...labels.filter((l) => !objectNames.has(l.description.toLowerCase())),
      ];

      const colors: ClothingColor[] = (
        response.imagePropertiesAnnotation?.dominantColors?.colors ?? []
      )
        .filter((c: any) => (c.pixelFraction ?? 0) >= MIN_COLOR_FRACTION)
        .sort((a: any, b: any) => (b.score ?? 0) - (a.score ?? 0))
        .slice(0, 6)
        .map((c: any) => ({
          hex: rgbToHex(c.color?.red, c.color?.green, c.color?.blue),
          score: c.score ?? 0,
          pixelFraction: c.pixelFraction ?? 0,
        }));

      return {
        labels,
        objects,
        clothing: classify(allLabels),
        colors,
      };
    } catch {
      throw new InternalServerErrorException(
        'Erro ao processar imagem com Google Vision',
      );
    }
  }
}
