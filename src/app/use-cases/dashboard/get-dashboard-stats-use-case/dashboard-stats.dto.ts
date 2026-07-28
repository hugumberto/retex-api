import { CollectionRequestStatus } from '../../../../domain/collection-request/collection-request.entity';

export interface CollectionRequestsStats {
  total: number;
  totalWeightKg: number;
  totalBags: number;
  byStatus: { status: CollectionRequestStatus; count: number }[];
  trend: { period: string; weightKg: number; count: number }[];
}

export interface DimensionStat {
  key: string;
  count: number;
  quantity: number;
}

export interface TriageStats {
  totalItems: number;
  byQuality: DimensionStat[];
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
