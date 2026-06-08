import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { IGoogleVisionService } from '../../../app/services/interfaces/google-vision.interface';
import { AnalyzeImageResult } from '../../../app/use-cases/vision/analyze-image-use-case/analyze-image.dto';

@Injectable()
export class GoogleVisionService implements IGoogleVisionService {
  private readonly client: ImageAnnotatorClient;

  constructor() {
    this.client = new ImageAnnotatorClient();
  }

  async analyzeImage(imageBase64: string): Promise<AnalyzeImageResult> {
    try {
      const imageBuffer = Buffer.from(imageBase64, 'base64');

      const [labelResponse, objectResponse] = await Promise.all([
        this.client.labelDetection({ image: { content: imageBuffer } }),
        this.client.objectLocalization({ image: { content: imageBuffer } }),
      ]);

      const labels = (labelResponse[0].labelAnnotations || [])
        .map((l) => ({ description: l.description || '', score: l.score || 0 }))
        .filter((l) => l.score >= 0.5);

      const objects = (objectResponse[0].localizedObjectAnnotations || [])
        .map((o) => ({ description: o.name || '', score: o.score || 0 }))
        .filter((o) => o.score >= 0.5);

      return { labels, objects };
    } catch {
      throw new InternalServerErrorException('Erro ao processar imagem com Google Vision');
    }
  }
}
