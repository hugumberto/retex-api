import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTestZoneDto {
  @IsString()
  @IsNotEmpty()
  city: string;
}
