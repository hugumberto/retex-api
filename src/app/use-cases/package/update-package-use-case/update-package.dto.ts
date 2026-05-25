import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { PackageStatus } from '../../../../domain/package/package.entity';

export class UpdatePackageDto {
  @IsOptional()
  @IsEnum(PackageStatus)
  status?: PackageStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;
}
