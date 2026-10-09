import { IsBoolean, IsOptional, IsString } from "class-validator";

export class UpdateBrandDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsBoolean()
  @IsOptional()
  manual?: boolean;

  @IsBoolean()
  @IsOptional()
  premium?: boolean;
}
