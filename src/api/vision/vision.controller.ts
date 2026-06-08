import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AnalyzeImageDto, AnalyzeImageUseCase } from '../../app/use-cases/vision';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('vision')
export class VisionController {
  constructor(private readonly analyzeImageUseCase: AnalyzeImageUseCase) {}

  @Post('analyze')
  @ApiOperation({ summary: 'Analisa uma imagem via Google Vision API' })
  async analyze(@Body() dto: AnalyzeImageDto) {
    return this.analyzeImageUseCase.call(dto);
  }
}
