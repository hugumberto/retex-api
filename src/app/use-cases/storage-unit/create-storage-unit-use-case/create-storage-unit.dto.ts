import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateIf } from "class-validator";
import { Season, Type } from "../../../../domain/item/item.entity";
import { StorageGroup } from "../../../../domain/storage-unit/storage-unit.entity";

export class CreateStorageUnitDto {
  @IsNotEmpty()
  @IsEnum(StorageGroup)
  group: StorageGroup;

  // Obrigatórios nos lotes de reutilização; ausentes no lote NON_REUSABLE.
  @ValidateIf((dto) => dto.group !== StorageGroup.NON_REUSABLE || dto.type != null)
  @IsEnum(Type)
  type?: Type;

  @ValidateIf((dto) => dto.group !== StorageGroup.NON_REUSABLE || dto.season != null)
  @IsEnum(Season)
  season?: Season;

  // Localização física (armazém / posição).
  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;
}
