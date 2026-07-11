import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min
} from 'class-validator';
import { AgeGroup, Quality, Season, Sex, Type } from '../../../../domain/item/item.entity';

export class CreateItemDto {
  @IsString()
  @IsNotEmpty()
  packageId: string;

  // Volume (QR code) ao qual o item pertence (triagem por volume).
  @IsOptional()
  @IsUUID()
  qrCodeId?: string;

  @IsEnum(Quality)
  @IsNotEmpty()
  quality: Quality;

  @IsEnum(Type)
  @IsNotEmpty()
  type: Type;

  @IsEnum(Season)
  @IsNotEmpty()
  season: Season;

  @IsEnum(Sex)
  @IsNotEmpty()
  sex: Sex;

  @IsEnum(AgeGroup)
  @IsNotEmpty()
  ageGroup: AgeGroup;

  @IsString()
  @IsNotEmpty()
  brandId: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}
