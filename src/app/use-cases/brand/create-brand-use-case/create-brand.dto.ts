import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateBrandDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  // Marca premium (indicador informativo nos relatórios da triagem).
  @IsOptional()
  @IsBoolean()
  premium?: boolean;
}
