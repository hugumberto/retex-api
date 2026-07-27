import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CollectionRequest, CollectionRequestStatus } from '../../../../domain/collection-request/collection-request.entity';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { RouteStatus } from '../../../../domain/route/route.entity';
import { IRouteRepository } from '../../../../domain/route/route.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { RejectCollectionDto } from './reject-collection.dto';

export { RejectCollectionDto };

/**
 * Cliente recusa a recolha pelo email: a solicitação sai da rota e volta a
 * ficar elegível (CREATED, sem rota, sem token/confirmação). Se as restantes
 * solicitações da rota já estão todas confirmadas, a rota avança de estado.
 */
@Injectable()
export class RejectCollectionUseCase
  implements IUseCase<RejectCollectionDto, CollectionRequest>
{
  constructor(
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY)
    private readonly collectionRequestRepository: ICollectionRequestRepository,
    @Inject(DOMAIN_TOKENS.ROUTE_REPOSITORY)
    private readonly routeRepository: IRouteRepository,
  ) {}

  async call({ token }: RejectCollectionDto): Promise<CollectionRequest> {
    const pkg = await this.collectionRequestRepository.findByCollectionConfirmationToken(
      token,
    );
    if (!pkg) {
      throw new NotFoundException('Token de confirmação inválido');
    }

    const routeId = pkg.route?.id;

    const [updated] = await this.collectionRequestRepository.update(
      { id: pkg.id },
      {
        route: null,
        status: CollectionRequestStatus.CREATED,
        collectionConfirmationToken: null,
        collectionConfirmedAt: null,
      },
    );

    await this.advanceRouteIfAllConfirmed(routeId);

    return updated;
  }

  private async advanceRouteIfAllConfirmed(routeId?: string): Promise<void> {
    if (!routeId) return;

    const route = await this.routeRepository.findOneWithAllRelations(routeId);
    if (!route || route.status !== RouteStatus.CREATED) return;

    const collectionRequests = route.collectionRequests ?? [];
    if (collectionRequests.length === 0) return;

    const allConfirmed = collectionRequests.every(
      (pkg) => pkg.collectionConfirmedAt != null,
    );
    if (!allConfirmed) return;

    await this.routeRepository.update(
      { id: route.id },
      { status: RouteStatus.WAITING_TO_START },
    );
  }
}
