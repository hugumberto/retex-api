import { IsEnum, IsNotEmpty } from "class-validator";
import { AgeGroup, Quality, Season, Sex, Type } from "../../../../domain/item/item.entity";

export class CreateStorageUnitDto {
  @IsNotEmpty()
  @IsEnum(Quality)
  quality: Quality;

  @IsNotEmpty()
  @IsEnum(Sex)
  sex: Sex;

  @IsNotEmpty()
  @IsEnum(AgeGroup)
  ageGroup: AgeGroup;

  @IsNotEmpty()
  @IsEnum(Type)
  type: Type;

  @IsNotEmpty()
  @IsEnum(Season)
  season: Season;
}