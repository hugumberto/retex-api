import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Route } from '../../../../domain/route/route.entity';
import { IRouteRepository } from '../../../../domain/route/route.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

// Deteta se o identificador é um UUID (id da rota) — caso contrário, assume-se
// o código amigável da rota (`ano-XXXXXX`).
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
      throw new NotFoundException('Route não encontrada');
    }

    return route;
  }

  // Aceita o id (UUID) ou o código amigável da rota e devolve o id.
  private async resolveRouteId(identifier: string): Promise<string> {
    const value = identifier.trim();

    if (UUID_REGEX.test(value)) {
      return value;
    }

    const byFriendlyCode = await this.routeRepository.findOne({
      friendlyCode: value,
    } as Partial<Route>);

    if (!byFriendlyCode) {
      throw new NotFoundException('Route não encontrada');
    }

    return byFriendlyCode.id;
  }
}
