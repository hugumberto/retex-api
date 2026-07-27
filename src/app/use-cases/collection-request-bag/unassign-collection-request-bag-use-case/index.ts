import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CollectionRequest } from '../../../../domain/collection-request/collection-request.entity';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { CollectionRequestBag } from '../../../../domain/collection-request-bag/collection-request-bag.entity';
import { ICollectionRequestBagRepository } from '../../../../domain/collection-request-bag/collection-request-bag.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

/**
 * Desassocia um volume (QR code) do seu pacote: limpa collection_request_id/used_at (o QR
 * volta ao pool da rota) e recalcula o nº de volumes do pacote.
 */
@Injectable()
export class UnassignCollectionRequestBagUseCase implements IUseCase<string, CollectionRequestBag> {
  constructor(
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_BAG_REPOSITORY)
    private readonly collectionRequestBagRepository: ICollectionRequestBagRepository,
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY)
    private readonly collectionRequestRepository: ICollectionRequestRepository,
  ) {}

  async call(bagId: string): Promise<CollectionRequestBag> {
    const qr = await this.collectionRequestBagRepository.findOne({ id: bagId });
    if (!qr) {
      throw new NotFoundException('Saco não encontrado');
    }

    const previousCollectionRequestId = qr.collectionRequestId;

    const [updated] = await this.collectionRequestBagRepository.update(
      { id: bagId },
      { collectionRequestId: null, usedAt: null } as Partial<CollectionRequestBag>,
    );

    if (previousCollectionRequestId) {
      await this.syncCollectionRequestBags(previousCollectionRequestId);
    }

    return updated ?? qr;
  }

  // Recalcula bags_generated do pacote a partir dos volumes ativos.
  private async syncCollectionRequestBags(collectionRequestId: string): Promise<void> {
    const remaining = await this.collectionRequestBagRepository.find({ collectionRequestId });
    await this.collectionRequestRepository.update(
      { id: collectionRequestId } as Partial<CollectionRequest>,
      { bagsGenerated: remaining.length } as Partial<CollectionRequest>,
    );
  }
}
