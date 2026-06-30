import { Test, TestingModule } from '@nestjs/testing';
import { GetDashboardStatsUseCase } from '../../app/use-cases/dashboard/get-dashboard-stats-use-case';
import { DashboardController } from './dashboard.controller';

describe('DashboardController', () => {
  let controller: DashboardController;
  let getDashboardStatsUseCase: GetDashboardStatsUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        { provide: GetDashboardStatsUseCase, useValue: { call: jest.fn() } },
      ],
    }).compile();

    controller = module.get(DashboardController);
    getDashboardStatsUseCase = module.get(GetDashboardStatsUseCase);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates to the use-case', async () => {
    const stats = { packages: { total: 1 } } as any;
    (getDashboardStatsUseCase.call as jest.Mock).mockResolvedValue(stats);
    expect(await controller.getStats()).toBe(stats);
    expect(getDashboardStatsUseCase.call).toHaveBeenCalledTimes(1);
  });
});
