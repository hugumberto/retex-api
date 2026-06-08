import { Inject, Injectable } from '@nestjs/common';
import { IGoogleVisionService } from '../../../services/interfaces/google-vision.interface';
import { SERVICE_TOKENS } from '../../../services/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { AnalyzeImageDto, AnalyzeImageResult } from './analyze-image.dto';

export { AnalyzeImageDto, AnalyzeImageResult };

@Injectable()
export class AnalyzeImageUseCase implements IUseCase<AnalyzeImageDto, AnalyzeImageResult> {
  constructor(
    @Inject(SERVICE_TOKENS.GOOGLE_VISION_SERVICE)
    private readonly googleVisionService: IGoogleVisionService,
  ) {}

  async call(param: AnalyzeImageDto): Promise<AnalyzeImageResult> {
    return this.googleVisionService.analyzeImage(param.imageBase64);
  }
}
