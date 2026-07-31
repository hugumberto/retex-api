import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CollectionRequest } from '../../../../domain/collection-request/collection-request.entity';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { CollectionRequestBag } from '../../../../domain/collection-request-bag/collection-request-bag.entity';
import { ICollectionRequestBagRepository } from '../../../../domain/collection-request-bag/collection-request-bag.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

export interface CollectionResult {
  collectionRequest: CollectionRequest;
  bags: CollectionRequestBag[];
}

// Deteta se o identificador recebido é um UUID (id do pacote) ou não — caso não
// seja, assume-se o código amigável (`ano-XXXXXX`).
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class GetCollectionUseCase implements IUseCase<string, CollectionResult> {
  constructor(
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY)
    private readonly collectionRequestRepository: ICollectionRequestRepository,
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_BAG_REPOSITORY)
    private readonly collectionRequestBagRepository: ICollectionRequestBagRepository,
  ) { }

  async call(identifier: string): Promise<CollectionResult> {
    const collectionRequestId = await this.resolveCollectionRequestId(identifier);

    const collectionRequestEntity =
      await this.collectionRequestRepository.findOneWithAllRelations(collectionRequestId);
    if (!collectionRequestEntity) {
      throw new NotFoundException('errors.collection.requestNotFound');
    }

    const bags = await this.collectionRequestBagRepository.find({ collectionRequestId });
    return { collectionRequest: collectionRequestEntity, bags };
  }

  // Aceita o id (UUID) ou o código amigável do pacote e devolve o id.
  private async resolveCollectionRequestId(identifier: string): Promise<string> {
    const value = identifier.trim();

    if (UUID_REGEX.test(value)) {
      return value;
    }

    const byFriendlyCode = await this.collectionRequestRepository.findOne({
      friendlyCode: value,
    } as Partial<CollectionRequest>);

    if (!byFriendlyCode) {
      throw new NotFoundException('errors.collection.requestNotFound');
    }

    return byFriendlyCode.id;
  }
}
