import { ArrayNotEmpty, IsArray, IsDateString, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateRouteDto {
  @IsString()
  @IsUUID()
  driverId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  packageIds: string[];

  @IsDateString()
  startDate: string;

  @IsString()
  @IsNotEmpty()
  shift: string;
} 