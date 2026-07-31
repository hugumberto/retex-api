import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Route } from '../../../../domain/route/route.entity';
import { IRouteRepository } from '../../../../domain/route/route.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { resolveEntityId } from '../../shared/identifier.util';

@Injectable()
export class GetRouteByIdUseCase implements IUseCase<string, Route> {
  constructor(
    @Inject(DOMAIN_TOKENS.ROUTE_REPOSITORY)
    private readonly routeRepository: IRouteRepository,
  ) { }

  async call(identifier: string): Promise<Route> {
    const routeId = await this.resolveRouteId(identifier);

    const route = await this.routeRepository.findOneWithAllRelations(routeId);

    if (!route) {
      throw new NotFoundException('errors.route.notFound');
    }

    return route;
  }

  // Aceita o id (UUID) ou o código amigável da rota e devolve o id.
  private resolveRouteId(identifier: string): Promise<string> {
    return resolveEntityId(
      identifier,
      (friendlyCode) =>
        this.routeRepository.findOne({ friendlyCode } as Partial<Route>),
      'errors.route.notFound',
    );
  }
}
