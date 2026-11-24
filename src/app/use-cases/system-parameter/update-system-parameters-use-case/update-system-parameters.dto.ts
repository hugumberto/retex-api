import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

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

  // Só múltiplos de 90: qualquer outro ângulo deixaria o conteúdo a transbordar
  // da etiqueta, sem hipótese de o enquadrar.
  @IsIn([0, 90, 180, 270])
  labelRotationDeg: number;

  // Armazém e tempos por paragem: opcionais, para quem só mexe nas etiquetas
  // não ter de os enviar. `null` apaga a morada/coordenadas.
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(255)
  warehouseAddress?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsNumber()
  @Min(-90)
  @Max(90)
  warehouseLat?: number | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsNumber()
  @Min(-180)
  @Max(180)
  warehouseLong?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  stopBaseMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(30)
  stopMinutesPerBag?: number;

  // Capacidade da zona do armazém, em kg.
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000000)
  zoneSortingCapacityKg?: number;

  // Capacidade da zona do armazém, em kg.
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000000)
  zoneReuseCapacityKg?: number;

  // Capacidade da zona do armazém, em kg.
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000000)
  zoneUpcyclingCapacityKg?: number;

  // Capacidade da zona do armazém, em kg.
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000000)
  zoneRecyclingCapacityKg?: number;

  // Meta de peças por hora em cada posto de triagem.
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  triageTargetPerHour?: number;
}
