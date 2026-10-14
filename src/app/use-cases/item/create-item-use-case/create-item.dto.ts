import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { Category } from '../../../../domain/item/item-category';
import {
  AgeGroup,
  Condition,
  Destination,
  Season,
  Sex,
  Type,
  isReusableDestination,
} from '../../../../domain/item/item.entity';

const reusable = (dto: CreateItemDto) =>
  isReusableDestination(dto.destination ?? Destination.REUSE);

export class CreateItemDto {
  @IsString()
  @IsNotEmpty()
  collectionRequestId: string;

  // Volume (QR code) ao qual o item pertence (triagem por volume).
  @IsOptional()
  @IsUUID()
  bagId?: string;

  // Omitido = REUSE.
  @IsOptional()
  @IsEnum(Destination)
  destination?: Destination;

  // Indicadores básicos: obrigatórios só para destinos reutilizáveis.
  @ValidateIf((dto) => reusable(dto) || dto.sex != null)
  @IsEnum(Sex)
  sex?: Sex;

  @ValidateIf((dto) => reusable(dto) || dto.ageGroup != null)
  @IsEnum(AgeGroup)
  ageGroup?: AgeGroup;

  @ValidateIf((dto) => reusable(dto) || dto.season != null)
  @IsEnum(Season)
  season?: Season;

  // A parte (Superior / Inferior) vem da categoria; `type` só é preciso sem ela.
  @ValidateIf((dto) => (reusable(dto) && dto.category == null) || dto.type != null)
  @IsEnum(Type)
  type?: Type;

  @ValidateIf((dto) => (reusable(dto) && dto.type == null) || dto.category != null)
  @IsEnum(Category)
  category?: Category;

  @ValidateIf((dto) => reusable(dto) || dto.condition != null)
  @IsEnum(Condition)
  condition?: Condition;

  @ValidateIf((dto) => reusable(dto) || dto.brandId != null)
  @IsString()
  @IsNotEmpty()
  brandId?: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  // Indicadores informativos opcionais.
  @IsOptional()
  @IsBoolean()
  denim?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  material?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  size?: string;
}
