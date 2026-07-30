import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CollectionRequestStatus } from '../../../../domain/collection-request/collection-request.entity';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { CollectionRequestBag } from '../../../../domain/collection-request-bag/collection-request-bag.entity';
import { ICollectionRequestBagRepository } from '../../../../domain/collection-request-bag/collection-request-bag.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

export interface ProcessTriageQrParams {
  bagId: string;
  weight: number;
}

/**
 * Processa um volume (QR code) na triagem: grava o peso do volume, marca-o como
 * processado e recalcula o peso do pacote como a soma dos pesos dos volumes.
 * A solicitação passa (ou permanece) em SCREENING. Os itens do volume são
 * criados/removidos pelos endpoints de item (com o bagId).
 */
@Injectable()
export class ProcessTriageQrUseCase
  implements IUseCase<ProcessTriageQrParams, CollectionRequestBag>
{
  constructor(
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_BAG_REPOSITORY)
    private readonly collectionRequestBagRepository: ICollectionRequestBagRepository,
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY)
    private readonly collectionRequestRepository: ICollectionRequestRepository,
  ) {}

  async call({ bagId, weight }: ProcessTriageQrParams): Promise<CollectionRequestBag> {
    const bag = await this.collectionRequestBagRepository.findOne({ id: bagId });
    if (!bag) {
      throw new NotFoundException('errors.qrCode.notFound');
    }
    if (!bag.collectionRequestId) {
      throw new BadRequestException('errors.triage.qrCodeNotLinked',
      );
    }

    const collectionRequestEntity = await this.collectionRequestRepository.findOne({
      id: bag.collectionRequestId,
    });
    if (!collectionRequestEntity) {
      throw new NotFoundException('errors.collection.requestNotFound');
    }
    if (
      collectionRequestEntity.status !== CollectionRequestStatus.COLLECTED &&
      collectionRequestEntity.status !== CollectionRequestStatus.SCREENING
    ) {
      throw new BadRequestException('errors.triage.requestNotInTriage',
      );
    }

    const [updatedQr] = await this.collectionRequestBagRepository.update(
      { id: bagId },
      { weight, processedAt: new Date() },
    );

    // Peso do pacote = soma dos pesos dos volumes (decimais vêm como string).
    const bags = await this.collectionRequestBagRepository.find({
      collectionRequestId: bag.collectionRequestId,
    });
    const totalWeight = bags.reduce(
      (sum, code) => sum + Number(code.weight ?? 0),
      0,
    );
    await this.collectionRequestRepository.update(
      { id: bag.collectionRequestId },
      { weight: totalWeight, status: CollectionRequestStatus.SCREENING },
    );

    return updatedQr;
  }
}
