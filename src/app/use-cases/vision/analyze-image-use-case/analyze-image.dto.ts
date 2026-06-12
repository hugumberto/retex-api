import { IsNotEmpty, IsString } from 'class-validator';

export class AnalyzeImageDto {
  @IsString()
  @IsNotEmpty()
  imageBase64: string;
}

export interface VisionLabel {
  description: string;
  score: number;
}

export interface ClothingColor {
  hex: string;
  score: number;
  pixelFraction: number;
}

export interface ClothingClassification {
  position: 'superior' | 'inferior' | 'completo' | null;
  season: 'primavera-verao' | 'outono-inverno' | null;
  gender: 'masculino' | 'feminino' | 'unisex' | null;
  ageGroup: 'adulto' | 'infantil' | null;
  brand: string | null;
}

export interface AnalyzeImageResult {
  labels: VisionLabel[];
  objects: VisionLabel[];
  clothing: {
    types: VisionLabel[];
    materials: VisionLabel[];
    styles: VisionLabel[];
    patterns: VisionLabel[];
    classification: ClothingClassification;
  };
  colors: ClothingColor[];
}
