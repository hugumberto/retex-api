import { Inject, Injectable } from '@nestjs/common';
import { PackageStatus } from '../../../../domain/package/package.entity';
import { IQrCodeRepository } from '../../../../domain/qr-code/qr-code.repository';
import { RouteStatus } from '../../../../domain/route/route.entity';
import { IRouteRepository } from '../../../../domain/route/route.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

/**
 * Finaliza a rota automaticamente quando TODOS os seus pacotes estão em
 * COLLECTED ou CANCELLED. Mesmo efeito colateral da transição manual em
 * update-route: apaga os QR codes não utilizados da rota. Idempotente.
 */
@Injectable()
export class FinishRouteIfAllCollectedUseCase implements IUseCase<string, void> {
  constructor(
    @Inject(DOMAIN_TOKENS.ROUTE_REPOSITORY)
    private readonly routeRepository: IRouteRepository,
    @Inject(DOMAIN_TOKENS.QR_CODE_REPOSITORY)
    private readonly qrCodeRepository: IQrCodeRepository,
  ) {}

  async call(routeId: string): Promise<void> {
    if (!routeId) return;

    const route = await this.routeRepository.findOneWithAllRelations(routeId);
    if (!route || route.status === RouteStatus.FINISHED) return;

    const packages = route.packages ?? [];
    if (packages.length === 0) return;

    const allDone = packages.every(
      (pkg) =>
        pkg.status === PackageStatus.COLLECTED ||
        pkg.status === PackageStatus.CANCELLED,
    );
    if (!allDone) return;

    await this.routeRepository.update(
      { id: routeId },
      { status: RouteStatus.FINISHED },
    );
    await this.qrCodeRepository.deleteUnusedByRoute(routeId);
  }
}
