import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CollectionRequest } from '../../../../domain/collection-request/collection-request.entity';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { CollectionRequestBag } from '../../../../domain/collection-request-bag/collection-request-bag.entity';
import { ICollectionRequestBagRepository } from '../../../../domain/collection-request-bag/collection-request-bag.repository';
import { Route } from '../../../../domain/route/route.entity';
import { IRouteRepository } from '../../../../domain/route/route.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

export interface SetCollectionRequestRouteParams {
  collectionRequestId: string;
  // null = retirar da rota.
  routeId: string | null;
}

/**
 * Vincula uma solicitação a uma rota existente, ou retira-a da rota em que
 * está. Ferramenta de correção do MASTER: ao contrário da composição da rota
 * em `UpdateRouteUseCase`, não exige rota em DRAFTING nem solicitação em
 * CREATED, e não mexe no estado da solicitação — o MASTER muda-o à parte, se
 * for preciso. Quem restringe ao MASTER é o `@Roles` do endpoint.
 *
 * Os sacos já associados à solicitação acompanham-na: passam a pertencer à
 * nova rota (ou a nenhuma), para não serem apanhados pela limpeza dos sacos
 * da rota antiga nem aparecerem na impressão dela.
 */
@Injectable()
export class SetCollectionRequestRouteUseCase
  implements IUseCase<SetCollectionRequestRouteParams, CollectionRequest>
{
  constructor(
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY)
    private readonly collectionRequestRepository: ICollectionRequestRepository,
    @Inject(DOMAIN_TOKENS.ROUTE_REPOSITORY)
    private readonly routeRepository: IRouteRepository,
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_BAG_REPOSITORY)
    private readonly collectionRequestBagRepository: ICollectionRequestBagRepository,
  ) {}

  async call({
    collectionRequestId,
    routeId,
  }: SetCollectionRequestRouteParams): Promise<CollectionRequest> {
    const collectionRequest =
      await this.collectionRequestRepository.findOneWithAllRelations(
        collectionRequestId,
      );
    if (!collectionRequest) {
      throw new NotFoundException('errors.collectionRequest.notFound');
    }

    let route: Route | null = null;
    if (routeId) {
      route = await this.routeRepository.findOne({ id: routeId });
      if (!route) {
        throw new NotFoundException('errors.route.notFound');
      }
    }

    if ((collectionRequest.route?.id ?? null) === (route?.id ?? null)) {
      return collectionRequest;
    }

    await this.collectionRequestRepository.update(
      { id: collectionRequestId },
      { route } as Partial<CollectionRequest>,
    );

    await this.collectionRequestBagRepository.update(
      { collectionRequestId },
      { routeId: route?.id ?? null } as Partial<CollectionRequestBag>,
    );

    return this.collectionRequestRepository.findOneWithAllRelations(
      collectionRequestId,
    );
  }
}
