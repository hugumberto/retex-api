import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Package, PackageStatus } from '../../../../domain/package/package.entity';
import { IPackageRepository } from '../../../../domain/package/package.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IEmailService } from '../../../services/interfaces/email.interface';
import { SERVICE_TOKENS } from '../../../services/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { FinishRouteIfAllCollectedUseCase } from '../../route/finish-route-if-all-collected-use-case';
import { buildCollectionCancelledEmail } from '../collection-cancelled-email';
import { CancelCollectionDto } from './cancel-collection.dto';

export { CancelCollectionDto };

export interface CancelCollectionParams {
  packageId: string;
  reason: string;
}

// Estados em que a solicitação já não pode ser cancelada na recolha.
const NON_CANCELLABLE = new Set<PackageStatus>([
  PackageStatus.COLLECTED,
  PackageStatus.IN_TRANSIT,
  PackageStatus.IN_HOUSE,
  PackageStatus.SCREENING,
  PackageStatus.STOCKED,
  PackageStatus.CANCELLED,
]);

/**
 * Motorista cancela uma recolha informando o motivo. A solicitação passa a
 * CANCELLED (com o motivo gravado), o cliente recebe um email com a mensagem e,
 * se todos os pacotes da rota ficarem coletados/cancelados, a rota é finalizada.
 */
@Injectable()
export class CancelCollectionUseCase
  implements IUseCase<CancelCollectionParams, Package>
{
  private readonly logger = new Logger(CancelCollectionUseCase.name);

  constructor(
    @Inject(DOMAIN_TOKENS.PACKAGE_REPOSITORY)
    private readonly packageRepository: IPackageRepository,
    @Inject(SERVICE_TOKENS.EMAIL_SERVICE)
    private readonly emailService: IEmailService,
    private readonly finishRouteIfAllCollectedUseCase: FinishRouteIfAllCollectedUseCase,
  ) {}

  async call({ packageId, reason }: CancelCollectionParams): Promise<Package> {
    const trimmed = (reason ?? '').trim();
    if (!trimmed) {
      throw new BadRequestException('Informe o motivo do cancelamento');
    }

    const pkg = await this.packageRepository.findOneWithAllRelations(packageId);
    if (!pkg) {
      throw new NotFoundException('Solicitação não encontrada');
    }
    if (NON_CANCELLABLE.has(pkg.status)) {
      throw new BadRequestException('Esta solicitação não pode ser cancelada');
    }

    const [updated] = await this.packageRepository.update(
      { id: packageId },
      { status: PackageStatus.CANCELLED, cancellationReason: trimmed },
    );

    // Email ao cliente com o motivo (fire-and-forget).
    if (pkg.user?.email) {
      this.emailService
        .send(buildCollectionCancelledEmail(pkg.user, trimmed, pkg.friendlyCode))
        .catch((err) =>
          this.logger.error(
            `Falha ao enviar email de cancelamento do package ${packageId}: ${err.message}`,
          ),
        );
    }

    // Se todos os pacotes da rota ficaram coletados/cancelados, a rota fecha.
    if (pkg.route?.id) {
      const routeId = pkg.route.id;
      this.finishRouteIfAllCollectedUseCase
        .call(routeId)
        .catch((err) =>
          this.logger.error(
            `Falha ao finalizar a rota ${routeId}: ${err.message}`,
          ),
        );
    }

    return updated;
  }
}
