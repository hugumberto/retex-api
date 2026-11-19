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
import { DashboardStatsDto, GetDashboardStatsDto } from './dashboard-stats.dto';
import { DashboardScope } from '../../../../domain/collection-request/collection-request.repository';

const TREND_MONTHS = 12;
const OUT_OF_ZONE_TOP_CITIES = 10;

const round = (value: number, decimals = 2): number => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

@Injectable()
export class GetDashboardStatsUseCase
  implements IUseCase<GetDashboardStatsDto | undefined, DashboardStatsDto>
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

  async call(filters: GetDashboardStatsDto = {}): Promise<DashboardStatsDto> {
    // Sem filtros o âmbito fica vazio e as agregações contam tudo, como antes.
    const scope: DashboardScope = {
      from: filters.from,
      to: filters.to,
      city: filters.city?.trim() || undefined,
    };
    const [
      totals,
      byStatus,
      trend,
      byCity,
      topCities,
      byCondition,
      byDestination,
      byCategory,
      bySeason,
      byType,
      byBrand,
      usersTotal,
      usersStatusActive,
      usersActive,
    ] = await Promise.all([
      this.collectionRequestRepository.getTotals(scope),
      this.collectionRequestRepository.countByStatus(scope),
      this.collectionRequestRepository.getWeightTrend(TREND_MONTHS, scope),
      this.collectionRequestRepository.weightByCity(scope),
      this.collectionRequestRepository.countOutOfZoneByCity(OUT_OF_ZONE_TOP_CITIES),
      this.itemRepository.aggregateBy('condition', scope),
        this.itemRepository.aggregateBy('destination', scope),
        this.itemRepository.aggregateBy('category', scope),
      this.itemRepository.aggregateBy('season', scope),
      this.itemRepository.aggregateBy('type', scope),
      this.itemRepository.aggregateByBrand(scope),
      this.userRepository.countAll(),
      this.userRepository.countByStatus(UserStatus.ACTIVE),
      this.refreshTokenRepository.countActiveUsers(),
    ]);

    // Todo o item tem destino: a soma por destino conta todos os itens.
    const totalItems = byDestination.reduce((acc, row) => acc + row.count, 0);
    const outOfZoneTotal =
      byStatus.find((row) => row.status === CollectionRequestStatus.OUT_OF_ZONE)?.count ??
      0;

    const { CO2_KG_PER_KG, WATER_LITERS_PER_KG } = ENVIRONMENTAL_FACTORS;
    const landfillDivertedKg = totals.totalWeight;

    return {
      collectionRequests: {
        total: totals.totalCollectionRequests,
        totalWeightKg: round(totals.totalWeight),
        totalEstimatedBags: totals.totalEstimatedBags,
        totalCollectedBags: totals.totalCollectedBags,
        byStatus,
        trend,
        byCity: byCity.map((row) => ({ ...row, weightKg: round(row.weightKg) })),
      },
      triage: {
        totalItems,
        byCondition,
        byDestination,
        byCategory,
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
