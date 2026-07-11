import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class BindItemsStorageUnitsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  items: string[];

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  storageUnits: string[];

  // true (default) = finaliza a triagem (STOCKED + survey, exige todos os
  // volumes processados). false = apenas persiste os vínculos (salvar progresso).
  @IsOptional()
  @IsBoolean()
  finalize?: boolean;
}
