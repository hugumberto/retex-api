import { Inject, Injectable } from '@nestjs/common';
import {
  DashboardScope,
  ICollectionRequestRepository,
} from '../../../../domain/collection-request/collection-request.repository';
import { ENVIRONMENTAL_FACTORS } from '../../../../domain/dashboard/environmental-factors';
import { IItemRepository } from '../../../../domain/item/item.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { CompanyContextService } from '../../../services/company-context/company-context.service';
import { IUseCase } from '../../interfaces/use-case.interface';
import { ScopedDashboardStatsDto } from './scoped-dashboard-stats.dto';

const TREND_MONTHS = 12;

const round = (value: number, decimals = 2): number => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

export interface GetScopedDashboardStatsParams {
  userId: string;
}

/**
 * Dashboard do próprio cliente: os mesmos indicadores do de ADMIN, restritos ao
 * que lhe pertence.
 *
 * Membro de empresa vê o agregado da empresa inteira, sem depender de
 * `REQUEST_VIEW_ALL` — ao contrário da listagem de solicitações, onde essa
 * permissão decide entre "as minhas" e "as da empresa". A diferença é
 * deliberada: aqui não se expõe nenhuma solicitação em concreto, só totais, e
 * o valor do ecrã para um colaborador está justamente em ver o esforço
 * conjunto. Sem contexto de empresa, o âmbito é o próprio utilizador.
 */
@Injectable()
export class GetScopedDashboardStatsUseCase
  implements IUseCase<GetScopedDashboardStatsParams, ScopedDashboardStatsDto>
{
  constructor(
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY)
    private readonly collectionRequestRepository: ICollectionRequestRepository,
    @Inject(DOMAIN_TOKENS.ITEM_REPOSITORY)
    private readonly itemRepository: IItemRepository,
    private readonly companyContextService: CompanyContextService,
  ) {}

  async call({
    userId,
  }: GetScopedDashboardStatsParams): Promise<ScopedDashboardStatsDto> {
    const companyContext = await this.companyContextService.resolve(userId);
    const scope: DashboardScope = companyContext
      ? { companyId: companyContext.companyId }
      : { userId };

    const [totals, byStatus, trend, byQuality, bySeason, byType, byBrand] =
      await Promise.all([
        this.collectionRequestRepository.getTotals(scope),
        this.collectionRequestRepository.countByStatus(scope),
        this.collectionRequestRepository.getWeightTrend(TREND_MONTHS, scope),
        this.itemRepository.aggregateBy('quality', scope),
        this.itemRepository.aggregateBy('season', scope),
        this.itemRepository.aggregateBy('type', scope),
        this.itemRepository.aggregateByBrand(scope),
      ]);

    const totalItems = byQuality.reduce((acc, row) => acc + row.count, 0);
    const { CO2_KG_PER_KG, WATER_LITERS_PER_KG } = ENVIRONMENTAL_FACTORS;
    const landfillDivertedKg = totals.totalWeight;

    const breakdown = companyContext
      ? await this.buildCompanyBreakdown(companyContext.companyId)
      : undefined;

    return {
      scope: companyContext ? 'COMPANY' : 'USER',
      company: companyContext
        ? { id: companyContext.companyId, name: companyContext.company.name }
        : undefined,
      collectionRequests: {
        total: totals.totalCollectionRequests,
        totalWeightKg: round(totals.totalWeight),
        totalEstimatedBags: totals.totalEstimatedBags,
        totalCollectedBags: totals.totalCollectedBags,
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
      breakdown,
    };
  }

  private async buildCompanyBreakdown(companyId: string) {
    const [byMember, byAddress] = await Promise.all([
      this.collectionRequestRepository.aggregateByMember(companyId),
      this.collectionRequestRepository.aggregateByAddress(companyId),
    ]);

    return {
      byMember: byMember.map((row) => ({
        id: row.userId,
        label: row.name,
        count: row.count,
        weightKg: round(row.weightKg),
      })),
      byAddress: byAddress.map((row) => ({
        id: row.addressId,
        label: row.label,
        count: row.count,
        weightKg: round(row.weightKg),
      })),
    };
  }
}
