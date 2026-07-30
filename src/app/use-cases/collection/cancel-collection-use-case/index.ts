import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CollectionRequest, CollectionRequestStatus } from '../../../../domain/collection-request/collection-request.entity';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IEmailService } from '../../../services/interfaces/email.interface';
import { SERVICE_TOKENS } from '../../../services/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { FinishRouteIfAllCollectedUseCase } from '../../route/finish-route-if-all-collected-use-case';
import { buildCollectionCancelledEmail } from '../collection-cancelled-email';
import { CancelCollectionDto } from './cancel-collection.dto';

export { CancelCollectionDto };

export interface CancelCollectionParams {
  collectionRequestId: string;
  reason: string;
}

// Estados em que a solicitação já não pode ser cancelada na recolha.
const NON_CANCELLABLE = new Set<CollectionRequestStatus>([
  CollectionRequestStatus.COLLECTED,
  CollectionRequestStatus.IN_TRANSIT,
  CollectionRequestStatus.IN_HOUSE,
  CollectionRequestStatus.SCREENING,
  CollectionRequestStatus.STOCKED,
  CollectionRequestStatus.CANCELLED,
]);

/**
 * Motorista cancela uma recolha informando o motivo. A solicitação passa a
 * CANCELLED (com o motivo gravado), o cliente recebe um email com a mensagem e,
 * se todos os pacotes da rota ficarem coletados/cancelados, a rota é finalizada.
 */
@Injectable()
export class CancelCollectionUseCase
  implements IUseCase<CancelCollectionParams, CollectionRequest>
{
  private readonly logger = new Logger(CancelCollectionUseCase.name);

  constructor(
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY)
    private readonly collectionRequestRepository: ICollectionRequestRepository,
    @Inject(SERVICE_TOKENS.EMAIL_SERVICE)
    private readonly emailService: IEmailService,
    private readonly finishRouteIfAllCollectedUseCase: FinishRouteIfAllCollectedUseCase,
  ) {}

  async call({ collectionRequestId, reason }: CancelCollectionParams): Promise<CollectionRequest> {
    const trimmed = (reason ?? '').trim();
    if (!trimmed) {
      throw new BadRequestException('errors.collection.cancellationReasonRequired');
    }

    const pkg = await this.collectionRequestRepository.findOneWithAllRelations(collectionRequestId);
    if (!pkg) {
      throw new NotFoundException('errors.collection.requestNotFound');
    }
    if (NON_CANCELLABLE.has(pkg.status)) {
      throw new BadRequestException('errors.collection.cannotCancel');
    }

    const [updated] = await this.collectionRequestRepository.update(
      { id: collectionRequestId },
      { status: CollectionRequestStatus.CANCELLED, cancellationReason: trimmed },
    );

    // Email ao cliente com o motivo (fire-and-forget).
    if (pkg.user?.email) {
      this.emailService
        .send(buildCollectionCancelledEmail(pkg.user, trimmed, pkg.friendlyCode))
        .catch((err) =>
          this.logger.error(
            `Falha ao enviar email de cancelamento do package ${collectionRequestId}: ${err.message}`,
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
