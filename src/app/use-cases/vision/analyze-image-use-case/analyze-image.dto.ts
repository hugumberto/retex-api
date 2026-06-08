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

export interface AnalyzeImageResult {
  labels: VisionLabel[];
  objects: VisionLabel[];
  clothing: {
    types: VisionLabel[];
    materials: VisionLabel[];
    styles: VisionLabel[];
    patterns: VisionLabel[];
  };
  colors: ClothingColor[];
}
