import { GetDashboardActivityUseCase } from './get-dashboard-activity-use-case';
import { GetDashboardStatsUseCase } from './get-dashboard-stats-use-case';
import { GetScopedDashboardStatsUseCase } from './get-scoped-dashboard-stats-use-case';

export const DASHBOARD_USE_CASES = [
  GetDashboardActivityUseCase,
  GetDashboardStatsUseCase,
  GetScopedDashboardStatsUseCase,
];

export { GetDashboardActivityUseCase } from './get-dashboard-activity-use-case';
export { GetDashboardStatsUseCase } from './get-dashboard-stats-use-case';
export { GetScopedDashboardStatsUseCase } from './get-scoped-dashboard-stats-use-case';
