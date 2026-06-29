import { IsEmail, IsNotEmpty } from 'class-validator';

export class SendActivationEmailDto {
  @IsEmail({}, { message: 'Email deve ser válido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;
}
