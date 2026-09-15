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

  // Limites largos de propósito: o que importa é recusar o absurdo (0 ou um
  // valor que nenhuma impressora de etiquetas aceita). A relação entre o QR e
  // a etiqueta é validada no use-case, onde os três valores se veem.
  @IsInt()
  @Min(20)
  @Max(210)
  labelWidthMm: number;

  @IsInt()
  @Min(20)
  @Max(297)
  labelHeightMm: number;

  @IsInt()
  @Min(10)
  @Max(200)
  labelQrSizeMm: number;
}
