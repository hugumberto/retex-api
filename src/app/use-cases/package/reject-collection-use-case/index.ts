import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Package, PackageStatus } from '../../../../domain/package/package.entity';
import { IPackageRepository } from '../../../../domain/package/package.repository';
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
  implements IUseCase<RejectCollectionDto, Package>
{
  constructor(
    @Inject(DOMAIN_TOKENS.PACKAGE_REPOSITORY)
    private readonly packageRepository: IPackageRepository,
    @Inject(DOMAIN_TOKENS.ROUTE_REPOSITORY)
    private readonly routeRepository: IRouteRepository,
  ) {}

  async call({ token }: RejectCollectionDto): Promise<Package> {
    const pkg = await this.packageRepository.findByCollectionConfirmationToken(
      token,
    );
    if (!pkg) {
      throw new NotFoundException('Token de confirmação inválido');
    }

    const routeId = pkg.route?.id;

    const [updated] = await this.packageRepository.update(
      { id: pkg.id },
      {
        route: null,
        status: PackageStatus.CREATED,
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

    const packages = route.packages ?? [];
    if (packages.length === 0) return;

    const allConfirmed = packages.every(
      (pkg) => pkg.collectionConfirmedAt != null,
    );
    if (!allConfirmed) return;

    await this.routeRepository.update(
      { id: route.id },
      { status: RouteStatus.WAITING_TO_START },
    );
  }
}
