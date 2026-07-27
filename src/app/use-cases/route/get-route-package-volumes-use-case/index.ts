import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { QrCode } from '../../../../domain/qr-code/qr-code.entity';
import { IQrCodeRepository } from '../../../../domain/qr-code/qr-code.repository';
import { IRouteRepository } from '../../../../domain/route/route.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

export interface RoutePackageVolumes {
  package: {
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
export class GetRoutePackageVolumesUseCase
  implements IUseCase<string, RoutePackageVolumes[]>
{
  constructor(
    @Inject(DOMAIN_TOKENS.ROUTE_REPOSITORY)
    private readonly routeRepository: IRouteRepository,
    @Inject(DOMAIN_TOKENS.QR_CODE_REPOSITORY)
    private readonly qrCodeRepository: IQrCodeRepository,
  ) {}

  async call(routeId: string): Promise<RoutePackageVolumes[]> {
    const route = await this.routeRepository.findOneWithAllRelations(routeId);
    if (!route) {
      throw new NotFoundException('Recolha não encontrada');
    }

    // Todos os QR codes da rota, agrupados por pacote.
    const qrCodes = await this.qrCodeRepository.findByRoute(routeId);
    const byPackage = new Map<string, QrCode[]>();
    for (const qr of qrCodes) {
      if (!qr.packageId) continue;
      const list = byPackage.get(qr.packageId) ?? [];
      list.push(qr);
      byPackage.set(qr.packageId, list);
    }

    return (route.packages ?? []).map((pkg) => ({
      package: {
        id: pkg.id,
        friendlyCode: pkg.friendlyCode,
        status: pkg.status,
        clientName: `${pkg.user?.firstName ?? ''} ${
          pkg.user?.lastName ?? ''
        }`.trim(),
        estimatedVolumes: pkg.estimatedVolumes,
      },
      qrCodes: byPackage.get(pkg.id) ?? [],
    }));
  }
}
