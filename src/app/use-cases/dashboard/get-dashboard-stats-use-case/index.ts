import { Inject, Injectable } from '@nestjs/common';
import { ENVIRONMENTAL_FACTORS } from '../../../../domain/dashboard/environmental-factors';
import { IItemRepository } from '../../../../domain/item/item.repository';
import { CollectionRequestStatus } from '../../../../domain/collection-request/collection-request.entity';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IRefreshTokenRepository } from '../../../../domain/user/refresh-token.repository';
import { UserStatus } from '../../../../domain/user/user-status.enum';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { IUseCase } from '../../interfaces/use-case.interface';
import { DashboardStatsDto } from './dashboard-stats.dto';

const TREND_MONTHS = 12;
const OUT_OF_ZONE_TOP_CITIES = 10;

const round = (value: number, decimals = 2): number => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

@Injectable()
export class GetDashboardStatsUseCase
  implements IUseCase<void, DashboardStatsDto>
{
  constructor(
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY)
    private readonly collectionRequestRepository: ICollectionRequestRepository,
    @Inject(DOMAIN_TOKENS.ITEM_REPOSITORY)
    private readonly itemRepository: IItemRepository,
    @Inject(DOMAIN_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(DOMAIN_TOKENS.REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async call(): Promise<DashboardStatsDto> {
    const [
      totals,
      byStatus,
      trend,
      topCities,
      byQuality,
      bySeason,
      byType,
      byBrand,
      usersTotal,
      usersStatusActive,
      usersActive,
    ] = await Promise.all([
      this.collectionRequestRepository.getTotals(),
      this.collectionRequestRepository.countByStatus(),
      this.collectionRequestRepository.getWeightTrend(TREND_MONTHS),
      this.collectionRequestRepository.countOutOfZoneByCity(OUT_OF_ZONE_TOP_CITIES),
      this.itemRepository.aggregateBy('quality'),
      this.itemRepository.aggregateBy('season'),
      this.itemRepository.aggregateBy('type'),
      this.itemRepository.aggregateByBrand(),
      this.userRepository.countAll(),
      this.userRepository.countByStatus(UserStatus.ACTIVE),
      this.refreshTokenRepository.countActiveUsers(),
    ]);

    const totalItems = byQuality.reduce((acc, row) => acc + row.count, 0);
    const outOfZoneTotal =
      byStatus.find((row) => row.status === CollectionRequestStatus.OUT_OF_ZONE)?.count ??
      0;

    const { CO2_KG_PER_KG, WATER_LITERS_PER_KG } = ENVIRONMENTAL_FACTORS;
    const landfillDivertedKg = totals.totalWeight;

    return {
      collectionRequests: {
        total: totals.totalCollectionRequests,
        totalWeightKg: round(totals.totalWeight),
        totalBags: totals.totalBags,
        byStatus,
        trend,
      },
      triage: {
        totalItems,
        byQuality,
        bySeason,
        byType,
        byBrand,
      },
      environment: {
        landfillDivertedKg: round(landfillDivertedKg),
        co2AvoidedKg: round(landfillDivertedKg * CO2_KG_PER_KG),
        waterSavedLiters: Math.round(landfillDivertedKg * WATER_LITERS_PER_KG),
        factors: {
          co2KgPerKg: CO2_KG_PER_KG,
          waterLitersPerKg: WATER_LITERS_PER_KG,
        },
      },
      users: {
        total: usersTotal,
        active: usersActive,
        statusActive: usersStatusActive,
      },
      outOfZone: {
        totalCollectionRequests: outOfZoneTotal,
        topCities,
      },
    };
  }
}
