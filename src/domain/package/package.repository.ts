import {
  PaginatedResult,
  PaginationParams,
} from '../interfaces/pagination.interface';
import { IRepository } from '../interfaces/repository.interface';
import { Package, PackageStatus } from './package.entity';

export interface PackageFilters {
  status?: PackageStatus;
  // Quando true, retorna apenas encomendas ainda não vinculadas a uma rota.
  unrouted?: boolean;
}

export interface PackageStatusCount {
  status: PackageStatus;
  count: number;
}

export interface PackageTotals {
  totalPackages: number;
  totalWeight: number;
  totalVolumes: number;
}

export interface PackageTrendPoint {
  period: string;
  weightKg: number;
  count: number;
}

export interface CityCount {
  city: string;
  count: number;
}

export interface IPackageRepository extends IRepository<Package> {
  findByFiltersWithPagination(
    filters: PackageFilters,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<Package>>;

  findOneWithAllRelations(id: string): Promise<Package>;
  findByUser(userId: string): Promise<Package[]>;
  findAll(): Promise<Package[]>;

  // Confirmação de coleta.
  findByCollectionConfirmationToken(token: string): Promise<Package>;
  // Cron: roteadas + CREATED + não confirmadas cujo prazo (startDate - days) passou.
  findExpiredUnconfirmed(days: number): Promise<Package[]>;
  // Cron: roteadas + CREATED + confirmadas cujo dia da coleta chegou.
  findDueConfirmed(): Promise<Package[]>;

  // Agregações para o dashboard (somente leitura).
  countByStatus(): Promise<PackageStatusCount[]>;
  getTotals(): Promise<PackageTotals>;
  getWeightTrend(months: number): Promise<PackageTrendPoint[]>;
  countOutOfZoneByCity(limit: number): Promise<CityCount[]>;
}
