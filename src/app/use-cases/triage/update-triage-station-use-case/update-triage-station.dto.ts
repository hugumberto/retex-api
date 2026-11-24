import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { TriageStationStatus } from '../../../../domain/triage-station/triage-station.entity';

export class PendingLotDto {
  @IsString()
  @MaxLength(120)
  label: string;

  @IsInt()
  @Min(0)
  pieces: number;
}

/** Sinal do posto: o que está a fazer agora. */
export class UpdateTriageStationDto {
  @IsEnum(TriageStationStatus)
  status: TriageStationStatus;

  // Pedido aberto no posto (nulo = nenhum).
  @IsOptional()
  @IsUUID()
  collectionRequestId?: string | null;

  // Lotes ainda sem caixa (passo "Caixas").
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => PendingLotDto)
  pendingLots?: PendingLotDto[];

  // O operador saiu do posto.
  @IsOptional()
  @IsBoolean()
  release?: boolean;
}
