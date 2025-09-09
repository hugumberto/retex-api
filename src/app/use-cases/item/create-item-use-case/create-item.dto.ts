import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min
} from 'class-validator';
import { Quality, Season, Type } from '../../../../domain/item/item.entity';

export class CreateItemDto {
  @IsString()
  @IsNotEmpty()
  packageId: string;

  @IsEnum(Quality)
  @IsNotEmpty()
  quality: Quality;

  @IsEnum(Type)
  @IsNotEmpty()
  type: Type;

  @IsEnum(Season)
  @IsNotEmpty()
  season: Season;

  @IsString()
  @IsNotEmpty()
  brandId: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}
