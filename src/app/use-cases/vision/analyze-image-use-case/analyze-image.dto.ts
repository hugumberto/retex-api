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

export interface AnalyzeImageResult {
  labels: VisionLabel[];
  objects: VisionLabel[];
}
