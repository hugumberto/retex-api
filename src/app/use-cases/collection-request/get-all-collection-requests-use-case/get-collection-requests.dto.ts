import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { CollectionRequestStatus } from '../../../../domain/collection-request/collection-request.entity';

export class GetCollectionRequestsDto {
  @IsOptional()
  @IsEnum(CollectionRequestStatus)
  status?: CollectionRequestStatus;

  // Apenas solicitações ainda não vinculadas a uma rota.
  // `@Type(() => Boolean)` não serve aqui: na query tudo chega como string e
  // `Boolean('false')` é `true`, o que faria `unrouted=false` filtrar na mesma.
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined ? undefined : value === true || value === 'true',
  )
  @IsBoolean()
  unrouted?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  // Limite alto por omissão: tanto a listagem de gestão como o mapa da tela de
  // recolha esperam ver tudo de uma vez.
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(1000)
  limit?: number = 1000;
}
