import { Controller, Get } from '@nestjs/common';
import { GetDashboardStatsUseCase } from '../../app/use-cases/dashboard/get-dashboard-stats-use-case';
import { Role } from '../../domain/user/user-roles.entity';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly getDashboardStatsUseCase: GetDashboardStatsUseCase,
  ) {}

  @Get('stats')
  @Roles(Role.ADMIN)
  getStats() {
    return this.getDashboardStatsUseCase.call();
  }
}
