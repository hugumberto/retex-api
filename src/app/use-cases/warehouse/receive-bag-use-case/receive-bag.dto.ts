import { IsNotEmpty, IsNumber, IsString, Max, MaxLength, Min } from 'class-validator';

export class ReceiveBagDto {
  // Código do saco (etiqueta ou token do QR) ou código do pedido.
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  code: string;

  // Peso bruto em kg.
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(1000)
  weight: number;
}
