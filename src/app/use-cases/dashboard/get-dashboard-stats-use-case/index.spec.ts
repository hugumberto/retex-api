import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { IItemRepository } from '../../../../domain/item/item.repository';
import { PackageStatus } from '../../../../domain/package/package.entity';
import { IPackageRepository } from '../../../../domain/package/package.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IRefreshTokenRepository } from '../../../../domain/user/refresh-token.repository';
import { UserStatus } from '../../../../domain/user/user-status.enum';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { GetDashboardStatsUseCase } from '.';

describe('GetDashboardStatsUseCase', () => {
  const packageRepo = mock<IPackageRepository>();
  const itemRepo = mock<IItemRepository>();
  const userRepo = mock<IUserRepository>();
  const refreshTokenRepo = mock<IRefreshTokenRepository>();
  let useCase: GetDashboardStatsUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        GetDashboardStatsUseCase,
        { provide: DOMAIN_TOKENS.PACKAGE_REPOSITORY, useValue: packageRepo },
        { provide: DOMAIN_TOKENS.ITEM_REPOSITORY, useValue: itemRepo },
        { provide: DOMAIN_TOKENS.USER_REPOSITORY, useValue: userRepo },
        {
          provide: DOMAIN_TOKENS.REFRESH_TOKEN_REPOSITORY,
          useValue: refreshTokenRepo,
        },
      ],
    }).compile();
    useCase = module.get(GetDashboardStatsUseCase);
  });

  it('aggregates stats and derives environmental impact + totals', async () => {
    packageRepo.getTotals.mockResolvedValue({
      totalPackages: 5,
      totalWeight: 100,
      totalVolumes: 12,
    });
    packageRepo.countByStatus.mockResolvedValue([
      { status: PackageStatus.CREATED, count: 3 },
      { status: PackageStatus.OUT_OF_ZONE, count: 2 },
    ]);
    packageRepo.getWeightTrend.mockResolvedValue([
      { period: '2026-06', weightKg: 100, count: 5 },
    ]);
    packageRepo.countOutOfZoneByCity.mockResolvedValue([
      { city: 'Porto', count: 2 },
    ]);
    itemRepo.aggregateBy.mockImplementation(async (dimension) =>
      dimension === 'quality'
        ? [
            { key: 'GOOD', count: 4, quantity: 8 },
            { key: 'BAD', count: 1, quantity: 1 },
          ]
        : [],
    );
    itemRepo.aggregateByBrand.mockResolvedValue([
      { brand: 'Nike', count: 3, quantity: 6 },
    ]);
    userRepo.countAll.mockResolvedValue(20);
    userRepo.countByStatus.mockResolvedValue(15);
    refreshTokenRepo.countActiveUsers.mockResolvedValue(7);

    const result = await useCase.call();

    expect(result.packages.total).toBe(5);
    expect(result.packages.totalWeightKg).toBe(100);
    expect(result.triage.totalItems).toBe(5);
    expect(result.environment.co2AvoidedKg).toBe(100 * 3.6);
    expect(result.environment.waterSavedLiters).toBe(100 * 10000);
    expect(result.users).toEqual({ total: 20, active: 7, statusActive: 15 });
    expect(result.outOfZone.totalPackages).toBe(2);
    expect(result.outOfZone.topCities).toEqual([{ city: 'Porto', count: 2 }]);
    expect(userRepo.countByStatus).toHaveBeenCalledWith(UserStatus.ACTIVE);
  });
});
