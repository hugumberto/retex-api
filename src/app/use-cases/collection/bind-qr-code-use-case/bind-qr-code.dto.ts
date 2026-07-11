import { IsNotEmpty, IsString } from 'class-validator';

export class BindQrCodeDto {
  // Token escaneado do QR ou código amigável (ano-XXXXXX) digitado.
  @IsString()
  @IsNotEmpty()
  code: string;
}
