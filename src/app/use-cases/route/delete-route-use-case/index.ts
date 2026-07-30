import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CollectionRequestStatus } from '../../../../domain/collection-request/collection-request.entity';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { Route, RouteStatus } from '../../../../domain/route/route.entity';
import { IRouteRepository } from '../../../../domain/route/route.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

@Injectable()
export class DeleteRouteUseCase implements IUseCase<string, Route> {
  constructor(
    @Inject(DOMAIN_TOKENS.ROUTE_REPOSITORY)
    private readonly routeRepository: IRouteRepository,
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY)
    private readonly collectionRequestRepository: ICollectionRequestRepository,
  ) { }

  async call(id: string): Promise<Route> {
    // 1. Verificar se a route existe
    const existingRoute = await this.routeRepository.findOneWithAllRelations(id);
    if (!existingRoute) {
      throw new NotFoundException('errors.route.notFound');
    }

    // 1.1. Recolha concluída não pode ser excluída.
    if (existingRoute.status === RouteStatus.FINISHED) {
      throw new BadRequestException('errors.route.cannotDeleteCompleted',
      );
    }

    // 2. Liberar os collectionRequests: desassociar da rota e voltar a CREATED (elegíveis).
    if (existingRoute.collectionRequests && existingRoute.collectionRequests.length > 0) {
      for (const collectionRequestEntity of existingRoute.collectionRequests) {
        await this.collectionRequestRepository.update(
          { id: collectionRequestEntity.id },
          {
            route: null,
            status: CollectionRequestStatus.CREATED,
            collectionConfirmationToken: null,
            collectionConfirmedAt: null,
          }
        );
      }
    }

    // 3. Fazer soft delete da route
    const deletedRoute = await this.routeRepository.delete({ id });

    return deletedRoute;
  }
}
