import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from "class-validator";
import { Season, Type } from "../../../../domain/item/item.entity";
import { StorageGroup, StorageUnitStatus } from "../../../../domain/storage-unit/storage-unit.entity";

export class UpdateStorageUnitDto {
  @IsOptional()
  @IsNotEmpty()
  @IsEnum(StorageGroup)
  group?: StorageGroup;

  // `null` limpa (lote NON_REUSABLE).
  @IsOptional()
  @IsEnum(Type)
  type?: Type | null;

  @IsOptional()
  @IsEnum(Season)
  season?: Season | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string | null;

  @IsOptional()
  @IsNotEmpty()
  @IsEnum(StorageUnitStatus)
  status?: StorageUnitStatus;

  @IsOptional()
  @IsNumber()
  weight?: number;
}
