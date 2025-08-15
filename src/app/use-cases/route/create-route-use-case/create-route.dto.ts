import { ArrayNotEmpty, IsArray, IsDateString, IsString, IsUUID } from 'class-validator';

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
} 