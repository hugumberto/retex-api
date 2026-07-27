import {
  PaginatedResult,
  PaginationParams,
} from '../interfaces/pagination.interface';
import { IRepository } from '../interfaces/repository.interface';
import {
  CollectionRequest,
  CollectionRequestStatus,
} from './collection-request.entity';

export interface CollectionRequestFilters {
  status?: CollectionRequestStatus;
  // Quando true, retorna apenas solicitações ainda não vinculadas a uma rota.
  unrouted?: boolean;
}

export interface CollectionRequestStatusCount {
  status: CollectionRequestStatus;
  count: number;
}

export interface CollectionRequestTotals {
  totalCollectionRequests: number;
  totalWeight: number;
  totalBags: number;
}

export interface CollectionRequestTrendPoint {
  period: string;
  weightKg: number;
  count: number;
}

export interface CityCount {
  city: string;
  count: number;
}

export interface ICollectionRequestRepository
  extends IRepository<CollectionRequest> {
  findByFiltersWithPagination(
    filters: CollectionRequestFilters,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<CollectionRequest>>;

  findOneWithAllRelations(id: string): Promise<CollectionRequest>;
  findByUser(userId: string): Promise<CollectionRequest[]>;
  findAll(): Promise<CollectionRequest[]>;

  // Confirmação de coleta.
  findByCollectionConfirmationToken(token: string): Promise<CollectionRequest>;
  // Cron: roteadas + CREATED + não confirmadas cujo prazo (startDate - days) passou.
  findExpiredUnconfirmed(days: number): Promise<CollectionRequest[]>;
  // Cron: roteadas + CREATED + confirmadas cujo dia da coleta chegou.
  findDueConfirmed(): Promise<CollectionRequest[]>;

  // Agregações para o dashboard (somente leitura).
  countByStatus(): Promise<CollectionRequestStatusCount[]>;
  getTotals(): Promise<CollectionRequestTotals>;
  getWeightTrend(months: number): Promise<CollectionRequestTrendPoint[]>;
  countOutOfZoneByCity(limit: number): Promise<CityCount[]>;
}
