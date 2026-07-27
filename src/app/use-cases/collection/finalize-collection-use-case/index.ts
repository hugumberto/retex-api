import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CollectionRequest, CollectionRequestStatus } from '../../../../domain/collection-request/collection-request.entity';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { IQrCodeRepository } from '../../../../domain/qr-code/qr-code.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { FinishRouteIfAllCollectedUseCase } from '../../route/finish-route-if-all-collected-use-case';

@Injectable()
export class FinalizeCollectionUseCase implements IUseCase<string, CollectionRequest> {
  private readonly logger = new Logger(FinalizeCollectionUseCase.name);

  constructor(
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY)
    private readonly collectionRequestRepository: ICollectionRequestRepository,
    @Inject(DOMAIN_TOKENS.QR_CODE_REPOSITORY)
    private readonly qrCodeRepository: IQrCodeRepository,
    private readonly finishRouteIfAllCollectedUseCase: FinishRouteIfAllCollectedUseCase,
  ) { }

  async call(collectionRequestId: string): Promise<CollectionRequest> {
    const collectionRequestEntity = await this.collectionRequestRepository.findOne({ id: collectionRequestId });
    if (!collectionRequestEntity) {
      throw new NotFoundException('Solicitação não encontrada');
    }
    if (collectionRequestEntity.status !== CollectionRequestStatus.WAITING_FOR_COLLECTION) {
      throw new BadRequestException('A solicitação não está aguardando recolha');
    }

    const qrCodes = await this.qrCodeRepository.find({ collectionRequestId });
    if (qrCodes.length === 0) {
      throw new BadRequestException(
        'Vincule ao menos um volume antes de finalizar a coleta',
      );
    }

    const [updated] = await this.collectionRequestRepository.update(
      { id: collectionRequestId },
      { status: CollectionRequestStatus.COLLECTED },
    );

    // Se todos os pacotes da rota já foram coletados/cancelados, a rota fecha.
    const withRoute =
      await this.collectionRequestRepository.findOneWithAllRelations(collectionRequestId);
    const routeId = withRoute?.route?.id;
    if (routeId) {
      this.finishRouteIfAllCollectedUseCase
        .call(routeId)
        .catch((err) =>
          this.logger.error(
            `Falha ao tentar finalizar a rota ${routeId}: ${err.message}`,
          ),
        );
    }

    return updated;
  }
}
