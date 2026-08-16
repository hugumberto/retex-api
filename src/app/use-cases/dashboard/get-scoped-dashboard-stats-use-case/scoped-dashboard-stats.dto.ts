import {
  CollectionRequestsStats,
  EnvironmentStats,
  TriageStats,
} from '../get-dashboard-stats-use-case/dashboard-stats.dto';

export interface CompanyBreakdownEntry {
  id: string;
  label: string;
  count: number;
  weightKg: number;
}

/**
 * Dashboard de um cliente — uma empresa ou um particular.
 *
 * Reaproveita os blocos do dashboard de ADMIN, menos dois: `users` é degenerado
 * para um particular, e `outOfZone` (cidades ainda por cobrir) é prospeção
 * interna da Retex, não informação de cliente.
 */
export interface ScopedDashboardStatsDto {
  scope: 'COMPANY' | 'USER';
  /** Preenchido quando `scope` é COMPANY. */
  company?: { id: string; name: string };
  collectionRequests: CollectionRequestsStats;
  triage: TriageStats;
  environment: EnvironmentStats;
  /** Só para empresas: quem pediu e de onde. */
  breakdown?: {
    byMember: CompanyBreakdownEntry[];
    byAddress: CompanyBreakdownEntry[];
  };
}
