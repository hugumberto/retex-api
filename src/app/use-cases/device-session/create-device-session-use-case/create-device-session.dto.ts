import { IsNotEmpty, IsString } from 'class-validator';

export class CreateDeviceSessionDto {
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @IsString()
  @IsNotEmpty()
  deviceLabel: string;
}
