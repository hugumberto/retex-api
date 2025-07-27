import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { Quality } from "../../../../domain/item/item.entity";

export class UpdateStorageUnitDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  brandId?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsEnum(Quality)
  quality?: Quality;

  @IsOptional()
  @IsNumber()
  weight?: number;
} 