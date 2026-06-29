import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Email deve ser válido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;
}
