import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IGoogleVisionService } from '../../../app/services/interfaces/google-vision.interface';
import {
  AnalyzeImageResult,
  ClothingClassification,
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

// ── Classification taxonomy ───────────────────────────────────────────────────

const SUPERIOR_TERMS = [
  'shirt', 't-shirt', 'blouse', 'top', 'tank top', 'polo',
  'sweater', 'sweatshirt', 'hoodie', 'pullover', 'turtleneck',
  'jacket', 'coat', 'blazer', 'cardigan', 'vest', 'windbreaker', 'parka',
  'bra', 'hat', 'cap', 'beanie', 'beret', 'fedora',
  'scarf', 'tie', 'bow tie', 'necktie', 'glove', 'mitten',
];

const INFERIOR_TERMS = [
  'pants', 'trousers', 'jeans', 'shorts', 'leggings', 'chinos', 'joggers',
  'skirt', 'underwear', 'boxer', 'brief',
  'sock', 'tights', 'stocking', 'pantyhose',
  'shoe', 'boot', 'sneaker', 'sandal', 'heel', 'loafer', 'slipper', 'belt',
];

const COMPLETO_TERMS = [
  'dress', 'gown', 'jumpsuit', 'romper', 'overalls', 'suit',
  'swimwear', 'bikini', 'swimsuit', 'uniform',
];

// Season scoring: positive = spring/summer, negative = autumn/winter
// Score ≥ 1 → primavera-verao | Score ≤ -1 → outono-inverno | 0 → no match
const SEASON_SCORES: Array<[string, number]> = [
  // Strong summer
  ['tank top', 3], ['tank', 2], ['shorts', 3], ['bikini', 3], ['swimsuit', 3],
  ['trunks', 3], ['swimwear', 3], ['sandal', 2], ['flip flop', 3], ['espadrille', 2],
  ['crop', 2], ['halter', 2], ['tube', 1], ['sundress', 2],
  ['linen', 2], ['chiffon', 2], ['seersucker', 2],
  ['summer', 3], ['sleeveless', 2],
  // Moderate summer
  ['t-shirt', 2], ['tee', 2], ['dress', 1], ['skirt', 1], ['blouse', 1], ['polo', 1],
  // Strong winter
  ['coat', -3], ['overcoat', -3], ['parka', -3], ['anorak', -3], ['trench', -2],
  ['sweater', -3], ['sweatshirt', -2], ['hoodie', -2], ['pullover', -3],
  ['turtleneck', -3], ['jumper', -2], ['cardigan', -2],
  ['scarf', -3], ['glove', -3], ['mitten', -3], ['beanie', -2], ['beret', -1],
  ['wool', -2], ['fleece', -3], ['cashmere', -2], ['flannel', -2], ['tweed', -2],
  ['fur', -2], ['thermal', -3], ['sherpa', -2],
  ['winter', -3], ['warm', -2],
  // Moderate winter
  ['jacket', -1], ['blazer', -1], ['windbreaker', -2], ['boot', -2],
  ['knit', -1], ['jeans', -1], ['denim', -1],
];

const FEMININE_TERMS = [
  'dress', 'skirt', 'blouse', 'bra', 'lingerie', 'gown', 'romper',
  'woman', 'female', 'feminine', 'ladies', 'girl',
];

const MASCULINE_TERMS = [
  'suit', 'necktie', 'tie', 'bow tie', 'boxer',
  'man', 'male', 'masculine', 'gentleman',
];

const CHILDREN_TERMS = [
  'child', 'kid', 'children', 'baby', 'infant', 'toddler',
  'boys', 'girls', 'juvenile', 'youth',
];

// ─────────────────────────────────────────────────────────────────────────────

function matchesAny(text: string, terms: string[]): boolean {
  const lower = text.toLowerCase();
  return terms.some((t) => lower.includes(t));
}

function countMatches(descriptions: string[], terms: string[]): number {
  return descriptions.filter((d) => matchesAny(d, terms)).length;
}

function classify(labels: VisionLabel[]) {
  return {
    types: labels.filter((l) => matchesAny(l.description, CLOTHING_TYPES)),
    materials: labels.filter((l) => matchesAny(l.description, MATERIALS)),
    styles: labels.filter((l) => matchesAny(l.description, STYLES)),
    patterns: labels.filter((l) => matchesAny(l.description, PATTERNS)),
  };
}

function classifyMeta(
  labels: VisionLabel[],
  logoDescriptions: string[],
): ClothingClassification {
  const descriptions = labels.map((l) => l.description);

  // Position
  const superiorCount = countMatches(descriptions, SUPERIOR_TERMS);
  const inferiorCount = countMatches(descriptions, INFERIOR_TERMS);
  const completoCount = countMatches(descriptions, COMPLETO_TERMS);
  let position: 'superior' | 'inferior' | 'completo' | null = null;
  const posMax = Math.max(superiorCount, inferiorCount, completoCount);
  if (posMax > 0) {
    if (completoCount === posMax) position = 'completo';
    else if (superiorCount === posMax) position = 'superior';
    else position = 'inferior';
  }

  // Season — weighted scoring: each detected label contributes its score
  let seasonScore = 0;
  for (const desc of descriptions) {
    const lower = desc.toLowerCase();
    for (const [term, weight] of SEASON_SCORES) {
      if (lower.includes(term)) {
        seasonScore += weight;
        break; // one term per label is enough
      }
    }
  }
  let season: 'primavera-verao' | 'outono-inverno' | null = null;
  if (seasonScore > 0) season = 'primavera-verao';
  else if (seasonScore < 0) season = 'outono-inverno';

  // Gender
  const feminineCount = countMatches(descriptions, FEMININE_TERMS);
  const masculineCount = countMatches(descriptions, MASCULINE_TERMS);
  let gender: 'masculino' | 'feminino' | 'unisex' | null = null;
  if (feminineCount > 0 || masculineCount > 0) {
    if (feminineCount > masculineCount) gender = 'feminino';
    else if (masculineCount > feminineCount) gender = 'masculino';
    else gender = 'unisex';
  }

  // Age group
  const isChildren = descriptions.some((d) => matchesAny(d, CHILDREN_TERMS));
  const ageGroup: 'adulto' | 'infantil' | null = position || season || gender
    ? isChildren ? 'infantil' : 'adulto'
    : null;

  // Brand — use highest-confidence logo if available
  const brand = logoDescriptions.length > 0 ? logoDescriptions[0] : null;

  return { position, season, gender, ageGroup, brand };
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
                { type: 'LOGO_DETECTION', maxResults: 5 },
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

      const logos: string[] = (response.logoAnnotations ?? [])
        .filter((l: any) => (l.score ?? 0) >= MIN_SCORE)
        .sort((a: any, b: any) => (b.score ?? 0) - (a.score ?? 0))
        .map((l: any) => l.description as string);

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
        clothing: {
          ...classify(allLabels),
          classification: classifyMeta(allLabels, logos),
        },
        colors,
      };
    } catch {
      throw new InternalServerErrorException(
        'Erro ao processar imagem com Google Vision',
      );
    }
  }
}
