import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CancelCollectionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason: string;
}
