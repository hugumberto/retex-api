import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CollectionRequestBag } from '../../../../domain/collection-request-bag/collection-request-bag.entity';
import { ICollectionRequestBagRepository } from '../../../../domain/collection-request-bag/collection-request-bag.repository';
import { IRouteRepository } from '../../../../domain/route/route.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

export interface RouteCollectionRequestBags {
  collectionRequest: {
    id: string;
    friendlyCode?: string | null;
    status: string;
    clientName: string;
    estimatedBags?: number;
  };
  bags: CollectionRequestBag[];
}

/**
 * Lista os pacotes de uma recolha (rota) com os QR codes (volumes) vinculados
 * a cada um. Usado no modal de detalhe da tela Gerir Recolha.
 */
@Injectable()
export class GetRouteCollectionRequestBagsUseCase
  implements IUseCase<string, RouteCollectionRequestBags[]>
{
  constructor(
    @Inject(DOMAIN_TOKENS.ROUTE_REPOSITORY)
    private readonly routeRepository: IRouteRepository,
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_BAG_REPOSITORY)
    private readonly collectionRequestBagRepository: ICollectionRequestBagRepository,
  ) {}

  async call(routeId: string): Promise<RouteCollectionRequestBags[]> {
    const route = await this.routeRepository.findOneWithAllRelations(routeId);
    if (!route) {
      throw new NotFoundException('errors.collection.notFound');
    }

    // Todos os QR codes da rota, agrupados por pacote.
    const bags = await this.collectionRequestBagRepository.findByRoute(routeId);
    const byCollectionRequest = new Map<string, CollectionRequestBag[]>();
    for (const qr of bags) {
      if (!qr.collectionRequestId) continue;
      const list = byCollectionRequest.get(qr.collectionRequestId) ?? [];
      list.push(qr);
      byCollectionRequest.set(qr.collectionRequestId, list);
    }

    return (route.collectionRequests ?? []).map((pkg) => ({
      collectionRequest: {
        id: pkg.id,
        friendlyCode: pkg.friendlyCode,
        status: pkg.status,
        clientName: `${pkg.user?.firstName ?? ''} ${
          pkg.user?.lastName ?? ''
        }`.trim(),
        estimatedBags: pkg.estimatedBags,
      },
      bags: byCollectionRequest.get(pkg.id) ?? [],
    }));
  }
}
