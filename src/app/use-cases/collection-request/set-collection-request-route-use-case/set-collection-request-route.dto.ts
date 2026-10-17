import { IsOptional, IsUUID } from 'class-validator';

export class SetCollectionRequestRouteDto {
  // null/omisso = retirar a solicitação da rota em que está.
  @IsOptional()
  @IsUUID()
  routeId?: string | null;
}
