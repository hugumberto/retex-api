import { Test, TestingModule } from '@nestjs/testing';
import { GetDashboardActivityUseCase } from '../../app/use-cases/dashboard/get-dashboard-activity-use-case';
import { GetDashboardStatsUseCase } from '../../app/use-cases/dashboard/get-dashboard-stats-use-case';
import { GetScopedDashboardStatsUseCase } from '../../app/use-cases/dashboard/get-scoped-dashboard-stats-use-case';
import { JwtPayload } from '../../app/services/interfaces/auth.interface';
import { DashboardController } from './dashboard.controller';

describe('DashboardController', () => {
  let controller: DashboardController;
  let getDashboardStatsUseCase: GetDashboardStatsUseCase;
  let getScopedDashboardStatsUseCase: GetScopedDashboardStatsUseCase;
  let getDashboardActivityUseCase: GetDashboardActivityUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        { provide: GetDashboardStatsUseCase, useValue: { call: jest.fn() } },
        {
          provide: GetScopedDashboardStatsUseCase,
          useValue: { call: jest.fn() },
        },
        {
          provide: GetDashboardActivityUseCase,
          useValue: { call: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get(DashboardController);
    getDashboardStatsUseCase = module.get(GetDashboardStatsUseCase);
    getScopedDashboardStatsUseCase = module.get(GetScopedDashboardStatsUseCase);
    getDashboardActivityUseCase = module.get(GetDashboardActivityUseCase);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates to the use-case', async () => {
    const stats = { collectionRequests: { total: 1 } } as any;
    (getDashboardStatsUseCase.call as jest.Mock).mockResolvedValue(stats);
    expect(await controller.getStats()).toBe(stats);
    expect(getDashboardStatsUseCase.call).toHaveBeenCalledTimes(1);
  });

  it('passa o filtro de datas ao quadro de atividade tal como veio', async () => {
    const activity = { requests: 51 } as any;
    (getDashboardActivityUseCase.call as jest.Mock).mockResolvedValue(activity);
    const query = { from: '2026-08-01', to: '2026-08-31' };

    expect(await controller.getActivity(query)).toBe(activity);
    expect(getDashboardActivityUseCase.call).toHaveBeenCalledWith(query);
  });

  it('scopes the client dashboard to the authenticated user', async () => {
    const stats = { scope: 'USER' } as any;
    (getScopedDashboardStatsUseCase.call as jest.Mock).mockResolvedValue(stats);
    const user = { sub: 'user-1' } as JwtPayload;

    expect(await controller.getMyStats(user)).toBe(stats);
    // O âmbito sai do token, nunca de um parâmetro do pedido — senão qualquer
    // utilizador pedia o dashboard de outro.
    expect(getScopedDashboardStatsUseCase.call).toHaveBeenCalledWith({
      userId: 'user-1',
    });
  });
});
