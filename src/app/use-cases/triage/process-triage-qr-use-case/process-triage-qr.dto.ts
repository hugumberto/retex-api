import { IsNumber, Min } from 'class-validator';

export class ProcessTriageQrDto {
  @IsNumber()
  @Min(0)
  weight: number;
}
