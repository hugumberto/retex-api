import { IsEnum, IsNotEmpty, IsString } from "class-validator";
import { Quality } from "../../../../domain/item/item.entity";

export class CreateStorageUnitDto {
  @IsString()
  @IsNotEmpty()
  brandId: string;

  @IsNotEmpty()
  @IsEnum(Quality)
  quality: Quality;
} 