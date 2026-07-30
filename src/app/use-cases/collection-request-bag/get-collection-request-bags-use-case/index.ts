import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CollectionRequest } from '../../../../domain/collection-request/collection-request.entity';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { CollectionRequestBag } from '../../../../domain/collection-request-bag/collection-request-bag.entity';
import { ICollectionRequestBagRepository } from '../../../../domain/collection-request-bag/collection-request-bag.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface CollectionRequestBagsResult {
  collectionRequest: Pick<
    CollectionRequest,
    'id' | 'friendlyCode' | 'status' | 'estimatedBags' | 'bagsGenerated'
  >;
  bags: CollectionRequestBag[];
}

/**
 * Lista os sacos (com etiqueta QR) de uma solicitação, resolvida por UUID ou
 * código amigável. Usado na tela de gestão de sacos.
 */
@Injectable()
export class GetCollectionRequestBagsUseCase
  implements IUseCase<string, CollectionRequestBagsResult>
{
  constructor(
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY)
    private readonly collectionRequestRepository: ICollectionRequestRepository,
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_BAG_REPOSITORY)
    private readonly collectionRequestBagRepository: ICollectionRequestBagRepository,
  ) {}

  async call(identifier: string): Promise<CollectionRequestBagsResult> {
    const value = identifier.trim();

    const pkg = UUID_REGEX.test(value)
      ? await this.collectionRequestRepository.findOne({ id: value } as Partial<CollectionRequest>)
      : await this.collectionRequestRepository.findOne({
          friendlyCode: value,
        } as Partial<CollectionRequest>);

    if (!pkg) {
      throw new NotFoundException('errors.collection.requestNotFound');
    }

    const bags = await this.collectionRequestBagRepository.find({ collectionRequestId: pkg.id });

    return {
      collectionRequest: {
        id: pkg.id,
        friendlyCode: pkg.friendlyCode,
        status: pkg.status,
        estimatedBags: pkg.estimatedBags,
        bagsGenerated: pkg.bagsGenerated,
      },
      bags,
    };
  }
}
