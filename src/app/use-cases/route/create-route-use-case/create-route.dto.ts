import { ArrayNotEmpty, IsArray, IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { CollectionInterval } from '../../../../domain/route/route.entity';

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

  @IsOptional()
  @IsEnum(CollectionInterval)
  collectionInterval?: CollectionInterval;
}