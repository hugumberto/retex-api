import { Inject, Injectable } from '@nestjs/common';
import { ENVIRONMENTAL_FACTORS } from '../../../../domain/dashboard/environmental-factors';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { Destination, isReusableDestination } from '../../../../domain/item/item.entity';
import { IItemRepository } from '../../../../domain/item/item.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

/**
 * Números da secção "Até agora" da landing. Público: só agregados, nada que
 * identifique clientes. Os mesmos cálculos do dashboard de admin, para os dois
 * nunca divergirem.
 */
export interface PublicImpactStatsDto {
  collectedKg: number;
  citiesServed: number;
  // Peças com destino reutilizável sobre as peças triadas (sem acessórios, que
  // não recolhemos), em percentagem inteira. Null sem peças triadas.
  reusedPercent: number | null;
  co2AvoidedKg: number;
  updatedAt: string;
}

@Injectable()
export class GetPublicImpactStatsUseCase
  implements IUseCase<void, PublicImpactStatsDto>
{
  constructor(
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY)
    private readonly collectionRequestRepository: ICollectionRequestRepository,
    @Inject(DOMAIN_TOKENS.ITEM_REPOSITORY)
    private readonly itemRepository: IItemRepository,
  ) {}

  async call(): Promise<PublicImpactStatsDto> {
    const [totals, citiesServed, byDestination] = await Promise.all([
      this.collectionRequestRepository.getTotals(),
      this.collectionRequestRepository.countCitiesServed(),
      this.itemRepository.aggregateBy('destination'),
    ]);

    const counted = byDestination.filter(
      (row) => row.key !== Destination.ACCESSORY,
    );
    const totalPieces = counted.reduce((acc, row) => acc + row.quantity, 0);
    const reusedPieces = counted
      .filter((row) => isReusableDestination(row.key as Destination))
      .reduce((acc, row) => acc + row.quantity, 0);

    return {
      collectedKg: Math.round(totals.totalWeight),
      citiesServed,
      reusedPercent:
        totalPieces > 0 ? Math.round((reusedPieces / totalPieces) * 100) : null,
      co2AvoidedKg: Math.round(
        totals.totalWeight * ENVIRONMENTAL_FACTORS.CO2_KG_PER_KG,
      ),
      updatedAt: new Date().toISOString(),
    };
  }
}
