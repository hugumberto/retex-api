import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CollectionRequest } from '../../../../domain/collection-request/collection-request.entity';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { CollectionRequestBag } from '../../../../domain/collection-request-bag/collection-request-bag.entity';
import { ICollectionRequestBagRepository } from '../../../../domain/collection-request-bag/collection-request-bag.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

/**
 * Elimina (soft-delete) um volume (QR code) e recalcula o nº de volumes do
 * pacote a que estava associado.
 */
@Injectable()
export class DeleteCollectionRequestBagUseCase implements IUseCase<string, CollectionRequestBag> {
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

    const collectionRequestId = qr.collectionRequestId;

    const deleted = await this.collectionRequestBagRepository.delete({ id: bagId });

    if (collectionRequestId) {
      const remaining = await this.collectionRequestBagRepository.find({ collectionRequestId });
      await this.collectionRequestRepository.update(
        { id: collectionRequestId } as Partial<CollectionRequest>,
        { bagsGenerated: remaining.length } as Partial<CollectionRequest>,
      );
    }

    return deleted;
  }
}
