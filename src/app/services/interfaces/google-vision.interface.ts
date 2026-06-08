import { AnalyzeImageResult } from '../../use-cases/vision/analyze-image-use-case/analyze-image.dto';

export interface IGoogleVisionService {
  analyzeImage(imageBase64: string): Promise<AnalyzeImageResult>;
}
