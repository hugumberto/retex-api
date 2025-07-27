import { IsEnum, IsNotEmpty, IsString } from "class-validator";
import { Role } from "../../../../domain/user/user-roles.entity";

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  contactPhone: string;

  @IsString()
  @IsNotEmpty()
  documentNumber: string;

  @IsNotEmpty()
  @IsEnum(Role)
  role: Role
}