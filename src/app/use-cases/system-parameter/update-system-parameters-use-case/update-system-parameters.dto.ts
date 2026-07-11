import { IsInt, Max, Min } from 'class-validator';

export class UpdateSystemParametersDto {
  @IsInt()
  @Min(0)
  @Max(30)
  collectionConfirmationDeadlineDays: number;

  @IsInt()
  @Min(0)
  @Max(100)
  qrCodeThresholdPercentage: number;
}
