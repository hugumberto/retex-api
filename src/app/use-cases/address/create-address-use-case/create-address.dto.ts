import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

// Aceita vazio ou um decimal com sinal — as coordenadas chegam como string do
// geocoder do frontend.
const DECIMAL_OR_EMPTY = /^(-?\d+(\.\d+)?)?$/;

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
  @Matches(DECIMAL_OR_EMPTY, { message: 'lat deve ser um número' })
  lat?: string;

  @IsString()
  @IsOptional()
  @Matches(DECIMAL_OR_EMPTY, { message: 'long deve ser um número' })
  long?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
