import { Inject, Injectable } from '@nestjs/common';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { ICollectionRequestBagRepository } from '../../../../domain/collection-request-bag/collection-request-bag.repository';
import { DateRange } from '../../../../domain/dashboard/date-range';
import { IItemRepository } from '../../../../domain/item/item.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import {
  DashboardActivityStats,
  GetDashboardActivityDto,
} from './dashboard-activity.dto';

export { GetDashboardActivityDto };

/**
 * Quadro de atividade: o funil do período — quantas solicitações entraram,
 * quantas foram recolhidas, quantas foram triadas e quantas peças isso deu.
 *
 * Cada número tem a sua própria data, e é de propósito: uma solicitação de
 * julho pode ser recolhida em agosto e triada em setembro. Filtrar tudo pela
 * data da solicitação daria um funil que nunca fecha; assim, cada coluna conta
 * o que aconteceu naquele intervalo, seja qual for a idade do pedido.
 */
@Injectable()
export class GetDashboardActivityUseCase
  implements IUseCase<GetDashboardActivityDto, DashboardActivityStats>
{
  constructor(
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY)
    private readonly collectionRequestRepository: ICollectionRequestRepository,
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_BAG_REPOSITORY)
    private readonly collectionRequestBagRepository: ICollectionRequestBagRepository,
    @Inject(DOMAIN_TOKENS.ITEM_REPOSITORY)
    private readonly itemRepository: IItemRepository,
  ) {}

  async call(param?: GetDashboardActivityDto): Promise<DashboardActivityStats> {
    const range: DateRange = { from: param?.from, to: param?.to };

    const [requests, collections, triages, pieces] = await Promise.all([
      this.collectionRequestRepository.countCreatedInRange(range),
      this.collectionRequestBagRepository.countRequestsCollectedInRange(range),
      this.collectionRequestBagRepository.countRequestsTriagedInRange(range),
      this.itemRepository.sumQuantityInRange(range),
    ]);

    return {
      from: range.from ?? null,
      to: range.to ?? null,
      requests,
      collections,
      triages,
      pieces,
    };
  }
}
