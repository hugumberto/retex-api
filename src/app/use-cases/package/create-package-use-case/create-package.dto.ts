import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreatePackageDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsUUID()
  @IsNotEmpty()
  addressId: string;

  @IsString()
  @IsOptional()
  dayOfWeek?: string;

  @IsString()
  @IsOptional()
  timeOfDay?: string;
}
