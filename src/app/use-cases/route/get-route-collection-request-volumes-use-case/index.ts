import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { QrCode } from '../../../../domain/qr-code/qr-code.entity';
import { IQrCodeRepository } from '../../../../domain/qr-code/qr-code.repository';
import { IRouteRepository } from '../../../../domain/route/route.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

export interface RouteCollectionRequestVolumes {
  collectionRequest: {
    id: string;
    friendlyCode?: string | null;
    status: string;
    clientName: string;
    estimatedVolumes?: number;
  };
  qrCodes: QrCode[];
}

/**
 * Lista os pacotes de uma recolha (rota) com os QR codes (volumes) vinculados
 * a cada um. Usado no modal de detalhe da tela Gerir Recolha.
 */
@Injectable()
export class GetRouteCollectionRequestVolumesUseCase
  implements IUseCase<string, RouteCollectionRequestVolumes[]>
{
  constructor(
    @Inject(DOMAIN_TOKENS.ROUTE_REPOSITORY)
    private readonly routeRepository: IRouteRepository,
    @Inject(DOMAIN_TOKENS.QR_CODE_REPOSITORY)
    private readonly qrCodeRepository: IQrCodeRepository,
  ) {}

  async call(routeId: string): Promise<RouteCollectionRequestVolumes[]> {
    const route = await this.routeRepository.findOneWithAllRelations(routeId);
    if (!route) {
      throw new NotFoundException('Recolha não encontrada');
    }

    // Todos os QR codes da rota, agrupados por pacote.
    const qrCodes = await this.qrCodeRepository.findByRoute(routeId);
    const byCollectionRequest = new Map<string, QrCode[]>();
    for (const qr of qrCodes) {
      if (!qr.collectionRequestId) continue;
      const list = byCollectionRequest.get(qr.collectionRequestId) ?? [];
      list.push(qr);
      byCollectionRequest.set(qr.collectionRequestId, list);
    }

    return (route.collectionRequests ?? []).map((pkg) => ({
      collectionRequest: {
        id: pkg.id,
        friendlyCode: pkg.friendlyCode,
        status: pkg.status,
        clientName: `${pkg.user?.firstName ?? ''} ${
          pkg.user?.lastName ?? ''
        }`.trim(),
        estimatedVolumes: pkg.estimatedVolumes,
      },
      qrCodes: byCollectionRequest.get(pkg.id) ?? [],
    }));
  }
}
