import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IPackageRepository } from '../../../../domain/package/package.repository';
import { Route } from '../../../../domain/route/route.entity';
import { IRouteRepository } from '../../../../domain/route/route.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

@Injectable()
export class DeleteRouteUseCase implements IUseCase<string, Route> {
  constructor(
    @Inject(DOMAIN_TOKENS.ROUTE_REPOSITORY)
    private readonly routeRepository: IRouteRepository,
    @Inject(DOMAIN_TOKENS.PACKAGE_REPOSITORY)
    private readonly packageRepository: IPackageRepository,
  ) { }

  async call(id: string): Promise<Route> {
    // 1. Verificar se a route existe
    const existingRoute = await this.routeRepository.findOneWithAllRelations(id);
    if (!existingRoute) {
      throw new NotFoundException('Route não encontrada');
    }

    // 2. Liberar todos os packages associados à rota (desassociar)
    if (existingRoute.packages && existingRoute.packages.length > 0) {
      for (const packageEntity of existingRoute.packages) {
        await this.packageRepository.update(
          { id: packageEntity.id },
          { route: null }
        );
      }
    }

    // 3. Fazer soft delete da route
    const deletedRoute = await this.routeRepository.delete({ id });

    return deletedRoute;
  }
}
