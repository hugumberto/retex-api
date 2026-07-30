import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CollectionRequest } from '../../../../domain/collection-request/collection-request.entity';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { CollectionRequestBag } from '../../../../domain/collection-request-bag/collection-request-bag.entity';
import { ICollectionRequestBagRepository } from '../../../../domain/collection-request-bag/collection-request-bag.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

export interface TriageCollectionRequestResult {
  collectionRequest: CollectionRequest;
  bags: CollectionRequestBag[];
}

/**
 * Consulta o pacote para triagem pelo código amigável da solicitação OU pelo
 * token/código amigável de um QR (volume). Retorna o pacote com relações e a
 * lista de volumes (QR codes) do pacote.
 */
@Injectable()
export class GetTriageCollectionRequestUseCase
  implements IUseCase<string, TriageCollectionRequestResult>
{
  constructor(
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY)
    private readonly collectionRequestRepository: ICollectionRequestRepository,
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_BAG_REPOSITORY)
    private readonly collectionRequestBagRepository: ICollectionRequestBagRepository,
  ) {}

  async call(code: string): Promise<TriageCollectionRequestResult> {
    let collectionRequestId: string | undefined;

    // 1. Tenta pelo código amigável da solicitação.
    const byCollectionRequest = await this.collectionRequestRepository.findOne({
      friendlyCode: code,
    } as Partial<CollectionRequest>);
    if (byCollectionRequest) {
      collectionRequestId = byCollectionRequest.id;
    } else {
      // 2. Tenta por um QR (token ou código amigável) → sua solicitação.
      let qr = await this.collectionRequestBagRepository.findOne({ token: code });
      if (!qr) {
        qr = await this.collectionRequestBagRepository.findOne({ friendlyCode: code });
      }
      if (qr?.collectionRequestId) {
        collectionRequestId = qr.collectionRequestId;
      }
    }

    if (!collectionRequestId) {
      throw new NotFoundException('errors.triage.requestNotFoundForCode',
      );
    }

    const collectionRequestEntity =
      await this.collectionRequestRepository.findOneWithAllRelations(collectionRequestId);
    if (!collectionRequestEntity) {
      throw new NotFoundException('errors.collection.requestNotFound');
    }

    const bags = await this.collectionRequestBagRepository.find({ collectionRequestId });
    return { collectionRequest: collectionRequestEntity, bags };
  }
}
