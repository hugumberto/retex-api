import { IsNotEmpty, IsString } from 'class-validator';

export class ConfirmCollectionDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}
