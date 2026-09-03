import { Controller, Get, Query } from '@nestjs/common';
import { GetDashboardActivityUseCase } from '../../app/use-cases/dashboard/get-dashboard-activity-use-case';
import { GetDashboardActivityDto } from '../../app/use-cases/dashboard/get-dashboard-activity-use-case/dashboard-activity.dto';
import { GetDashboardStatsUseCase } from '../../app/use-cases/dashboard/get-dashboard-stats-use-case';
import { GetScopedDashboardStatsUseCase } from '../../app/use-cases/dashboard/get-scoped-dashboard-stats-use-case';
import { JwtPayload } from '../../app/services/interfaces/auth.interface';
import { Role } from '../../domain/user/user-roles.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly getDashboardStatsUseCase: GetDashboardStatsUseCase,
    private readonly getScopedDashboardStatsUseCase: GetScopedDashboardStatsUseCase,
    private readonly getDashboardActivityUseCase: GetDashboardActivityUseCase,
  ) {}

  // Visão global da operação. Continua exclusiva de ADMIN e sem âmbito: dar-lhe
  // uma vista filtrada sem ele pedir seria enganador.
  @Get('stats')
  @Roles(Role.ADMIN)
  getStats() {
    return this.getDashboardStatsUseCase.call();
  }

  // Quadro de atividade do período. Sem filtro conta tudo; com `from`/`to`
  // (YYYY-MM-DD, ambos inclusive) restringe ao intervalo.
  @Get('activity')
  @Roles(Role.ADMIN)
  getActivity(@Query() query: GetDashboardActivityDto) {
    return this.getDashboardActivityUseCase.call(query);
  }

  // Dashboard do próprio cliente. Aberto a Role.USER porque é a role global de
  // qualquer membro de empresa e de qualquer particular — quem decide o âmbito
  // é o contexto de empresa, resolvido dentro do use case.
  @Get('me')
  @Roles(Role.ADMIN, Role.USER)
  getMyStats(@CurrentUser() user: JwtPayload) {
    return this.getScopedDashboardStatsUseCase.call({ userId: user.sub });
  }
}
