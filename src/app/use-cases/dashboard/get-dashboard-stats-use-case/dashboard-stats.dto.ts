import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { CollectionRequestStatus } from '../../../../domain/collection-request/collection-request.entity';
import { DATE_ONLY_PATTERN } from '../../../../domain/dashboard/date-range';

/** Filtros do dashboard de impacto: período (inclusivo) e concelho. Tudo opcional. */
export class GetDashboardStatsDto {
  @IsOptional()
  @Matches(DATE_ONLY_PATTERN, { message: 'from deve ser uma data YYYY-MM-DD' })
  from?: string;

  @IsOptional()
  @Matches(DATE_ONLY_PATTERN, { message: 'to deve ser uma data YYYY-MM-DD' })
  to?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;
}

export interface CollectionRequestsStats {
  total: number;
  totalWeightKg: number;
  // Sacos estimados pelos clientes vs. efetivamente recolhidos.
  totalEstimatedBags: number;
  totalCollectedBags: number;
  byStatus: { status: CollectionRequestStatus; count: number }[];
  trend: { period: string; weightKg: number; count: number }[];
  // Peso recolhido por concelho, do maior para o menor.
  byCity?: { city: string; weightKg: number; count: number }[];
}

export interface DimensionStat {
  key: string;
  count: number;
  quantity: number;
}

export interface TriageStats {
  totalItems: number;
  byCondition: DimensionStat[];
  byDestination: DimensionStat[];
  byCategory: DimensionStat[];
  bySeason: DimensionStat[];
  byType: DimensionStat[];
  byBrand: { brand: string; count: number; quantity: number }[];
}

export interface EnvironmentStats {
  landfillDivertedKg: number;
  co2AvoidedKg: number;
  waterSavedLiters: number;
  factors: {
    co2KgPerKg: number;
    waterLitersPerKg: number;
  };
}

export interface UsersStats {
  /** Total de utilizadores registados. */
  total: number;
  /** Utilizadores com sessão válida (token não revogado e não expirado). */
  active: number;
  /** Utilizadores com conta marcada como ACTIVE (status da conta). */
  statusActive: number;
}

export interface OutOfZoneStats {
  totalCollectionRequests: number;
  topCities: { city: string; count: number }[];
}

export interface DashboardStatsDto {
  collectionRequests: CollectionRequestsStats;
  triage: TriageStats;
  environment: EnvironmentStats;
  users: UsersStats;
  outOfZone: OutOfZoneStats;
}
