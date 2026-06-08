import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GoogleVisionService } from './google-vision.service';

@Module({
  imports: [ConfigModule],
  providers: [GoogleVisionService],
  exports: [GoogleVisionService],
})
export class GoogleVisionModule {}
