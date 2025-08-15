import { ArrayMinSize, IsArray, IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { RouteStatus } from '../../../../domain/route/route.entity';

export class UpdateRouteDto {
  @IsOptional()
  @IsEnum(RouteStatus)
  status?: RouteStatus;

  @IsOptional()
  @IsString()
  @IsUUID()
  driverId?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  packageIds?: string[];

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
} 