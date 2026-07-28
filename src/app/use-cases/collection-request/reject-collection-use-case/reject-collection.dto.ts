import { IsNotEmpty, IsString } from 'class-validator';

export class RejectCollectionDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}
