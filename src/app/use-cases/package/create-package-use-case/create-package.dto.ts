import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class AddressDto {
  @IsString()
  @IsNotEmpty()
  street: string;

  @IsString()
  @IsNotEmpty()
  number: string;

  @IsString()
  @IsOptional()
  complement?: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  cityDivision: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsString()
  @IsNotEmpty()
  countryDivision: string;

  @IsString()
  @IsNotEmpty()
  zipCode: string;

  @IsString()
  @IsNotEmpty()
  lat: string;

  @IsString()
  @IsNotEmpty()
  long: string;
}

export class CreatePackageDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  contactPhone: string;

  @IsString()
  @IsOptional()
  dayOfWeek?: string;

  @IsString()
  @IsOptional()
  timeOfDay?: string;

  @IsString()
  @IsNotEmpty()
  nif: string;

  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;
} 