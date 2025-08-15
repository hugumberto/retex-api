import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Route } from '../../../../domain/route/route.entity';
import { IRouteRepository } from '../../../../domain/route/route.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

@Injectable()
export class GetRouteByIdUseCase implements IUseCase<string, Route> {
  constructor(
    @Inject(DOMAIN_TOKENS.ROUTE_REPOSITORY)
    private readonly routeRepository: IRouteRepository,
  ) { }

  async call(id: string): Promise<Route> {
    const route = await this.routeRepository.findOneWithAllRelations(id);

    if (!route) {
      throw new NotFoundException('Route não encontrada');
    }

    return route;
  }
} 