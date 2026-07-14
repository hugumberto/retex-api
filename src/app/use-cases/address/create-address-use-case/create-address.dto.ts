import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateAddressDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  street: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  number: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  complement?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  city: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  cityDivision?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  country?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  countryDivision?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  zipCode: string;

  @IsString()
  @IsOptional()
  lat?: string;

  @IsString()
  @IsOptional()
  long?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
