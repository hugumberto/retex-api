import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreatePackageDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsUUID()
  @IsNotEmpty()
  addressId: string;

  @IsInt({ message: 'Estimativa de volumes deve ser um número inteiro' })
  @Min(1, { message: 'Estimativa de volumes deve ser pelo menos 1' })
  estimatedVolumes: number;

  @IsString()
  @IsOptional()
  dayOfWeek?: string;

  @IsString()
  @IsOptional()
  timeOfDay?: string;
}
