import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { OutboundType } from '../../../../domain/warehouse/warehouse-outbound.entity';

export class SaveOutboundDto {
  @IsEnum(OutboundType)
  type: OutboundType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  destination: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  scheduledDate: string;

  // Lotes que saem. Sem lotes, vale o peso / peças escritos.
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @IsUUID('4', { each: true })
  storageUnitIds?: string[];

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100000)
  weight?: number | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  @Min(0)
  @Max(1000000)
  pieces?: number | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(500)
  notes?: string | null;
}
