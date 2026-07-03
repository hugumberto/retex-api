import { IsNotEmpty, IsString } from 'class-validator';

export class MarkQrCodeUsedDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}
