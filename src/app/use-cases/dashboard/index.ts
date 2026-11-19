import { GetDashboardActivityUseCase } from './get-dashboard-activity-use-case';
import { GetDashboardStatsUseCase } from './get-dashboard-stats-use-case';
import { GetPublicImpactStatsUseCase } from './get-public-impact-stats-use-case';
import { GetScopedDashboardStatsUseCase } from './get-scoped-dashboard-stats-use-case';

export const DASHBOARD_USE_CASES = [
  GetDashboardActivityUseCase,
  GetDashboardStatsUseCase,
  GetPublicImpactStatsUseCase,
  GetScopedDashboardStatsUseCase,
];

export { GetDashboardActivityUseCase } from './get-dashboard-activity-use-case';
export { GetDashboardStatsUseCase } from './get-dashboard-stats-use-case';
export { GetPublicImpactStatsUseCase } from './get-public-impact-stats-use-case';
export { GetScopedDashboardStatsUseCase } from './get-scoped-dashboard-stats-use-case';
