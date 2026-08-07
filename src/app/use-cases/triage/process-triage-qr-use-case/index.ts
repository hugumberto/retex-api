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
  /** false = grava só o peso (guardar progresso); o volume fica por terminar. */
  markProcessed?: boolean;
}

/**
 * Processa um volume (QR code) na triagem: grava o peso do volume, marca-o como
 * processado e recalcula o peso do pacote como a soma dos pesos dos volumes.
 * A solicitação passa (ou permanece) em SCREENING. Os itens do volume são
 * criados/removidos pelos endpoints de item (com o bagId).
 *
 * Com `markProcessed: false` grava apenas o peso — é o "guardar progresso" da
 * triagem, para que o peso não se perca se o operador sair do ecrã a meio do
 * volume. O volume continua com `processedAt` nulo e, por isso, continua a
 * impedir a finalização da triagem (ver BindItemsStorageUnitsUseCase).
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

  async call({
    bagId,
    weight,
    markProcessed = true,
  }: ProcessTriageQrParams): Promise<CollectionRequestBag> {
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

    // Sem `processedAt` no update, o valor existente é preservado (o repositório
    // faz Object.assign + save) — regravar o peso não despromove um volume que
    // já tenha sido processado.
    const [updatedQr] = await this.collectionRequestBagRepository.update(
      { id: bagId },
      markProcessed ? { weight, processedAt: new Date() } : { weight },
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
