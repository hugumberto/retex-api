import { IsEnum, IsNotEmpty, IsNumber, IsOptional } from "class-validator";
import { AgeGroup, Quality, Season, Sex, Type } from "../../../../domain/item/item.entity";

export class UpdateStorageUnitDto {
  @IsOptional()
  @IsNotEmpty()
  @IsEnum(Quality)
  quality?: Quality;

  @IsOptional()
  @IsNotEmpty()
  @IsEnum(Sex)
  sex?: Sex;

  @IsOptional()
  @IsNotEmpty()
  @IsEnum(AgeGroup)
  ageGroup?: AgeGroup;

  @IsOptional()
  @IsNotEmpty()
  @IsEnum(Type)
  type?: Type;

  @IsOptional()
  @IsNotEmpty()
  @IsEnum(Season)
  season?: Season;

  @IsOptional()
  @IsNumber()
  weight?: number;
}