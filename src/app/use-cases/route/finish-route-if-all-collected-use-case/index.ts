import { Inject, Injectable, Logger } from '@nestjs/common';
import { CollectionRequestStatus } from '../../../../domain/collection-request/collection-request.entity';
import { IQrCodeRepository } from '../../../../domain/qr-code/qr-code.repository';
import { RouteStatus } from '../../../../domain/route/route.entity';
import { IRouteRepository } from '../../../../domain/route/route.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { SendRouteSurveyUseCase } from '../send-route-survey-use-case';

/**
 * Finaliza a rota automaticamente quando TODOS os seus pacotes estão em
 * COLLECTED ou CANCELLED. Mesmo efeito colateral da transição manual em
 * update-route: apaga os QR codes não utilizados da rota. Idempotente.
 */
@Injectable()
export class FinishRouteIfAllCollectedUseCase implements IUseCase<string, void> {
  private readonly logger = new Logger(FinishRouteIfAllCollectedUseCase.name);

  constructor(
    @Inject(DOMAIN_TOKENS.ROUTE_REPOSITORY)
    private readonly routeRepository: IRouteRepository,
    @Inject(DOMAIN_TOKENS.QR_CODE_REPOSITORY)
    private readonly qrCodeRepository: IQrCodeRepository,
    private readonly sendRouteSurveyUseCase: SendRouteSurveyUseCase,
  ) {}

  async call(routeId: string): Promise<void> {
    if (!routeId) return;

    const route = await this.routeRepository.findOneWithAllRelations(routeId);
    if (!route || route.status === RouteStatus.FINISHED) return;

    const collectionRequests = route.collectionRequests ?? [];
    if (collectionRequests.length === 0) return;

    const allDone = collectionRequests.every(
      (pkg) =>
        pkg.status === CollectionRequestStatus.COLLECTED ||
        pkg.status === CollectionRequestStatus.CANCELLED,
    );
    if (!allDone) return;

    await this.routeRepository.update(
      { id: routeId },
      { status: RouteStatus.FINISHED },
    );
    await this.qrCodeRepository.deleteUnusedByRoute(routeId);

    // Rota finalizada → questionário de satisfação aos clientes (fire-and-forget).
    this.sendRouteSurveyUseCase.sendForRoute(route).catch((err) =>
      this.logger.error(
        `Falha ao enviar questionário da rota ${routeId}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      ),
    );
  }
}
