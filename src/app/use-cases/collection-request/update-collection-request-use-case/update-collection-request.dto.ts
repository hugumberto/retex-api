import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { CollectionRequestStatus } from '../../../../domain/collection-request/collection-request.entity';

export class UpdateCollectionRequestDto {
  @IsOptional()
  @IsEnum(CollectionRequestStatus)
  status?: CollectionRequestStatus;

  @IsOptional()
  @IsNumber()
  @Min(1)
  weight?: number;
}
