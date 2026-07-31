import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CollectionRequest } from '../../../../domain/collection-request/collection-request.entity';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { CollectionRequestBag } from '../../../../domain/collection-request-bag/collection-request-bag.entity';
import { ICollectionRequestBagRepository } from '../../../../domain/collection-request-bag/collection-request-bag.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { isUuid } from '../../shared/identifier.util';

export interface CollectionRequestDetail {
  collectionRequest: CollectionRequest;
  bags: CollectionRequestBag[];
}

/**
 * Solicitação de recolha (com relações) e os seus sacos, resolvida por qualquer
 * um dos identificadores que circulam no sistema: o UUID, o código amigável da
 * solicitação, ou o token/código amigável de um saco — que é o que sai do
 * leitor de QR.
 *
 * Substitui três implementações que faziam o mesmo com estratégias de resolução
 * parciais e diferentes entre si (coleta, triagem e gestão de sacos). Os
 * endpoints e os respetivos `@Roles` mantêm-se separados; só a implementação é
 * que passou a ser uma.
 */
@Injectable()
export class GetCollectionRequestDetailUseCase
  implements IUseCase<string, CollectionRequestDetail>
{
  constructor(
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY)
    private readonly collectionRequestRepository: ICollectionRequestRepository,
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_BAG_REPOSITORY)
    private readonly collectionRequestBagRepository: ICollectionRequestBagRepository,
  ) { }

  async call(identifier: string): Promise<CollectionRequestDetail> {
    const collectionRequestId = await this.resolve(identifier);

    const collectionRequest =
      await this.collectionRequestRepository.findOneWithAllRelations(
        collectionRequestId,
      );

    if (!collectionRequest) {
      throw new NotFoundException('errors.collection.requestNotFound');
    }

    const bags = await this.collectionRequestBagRepository.find({
      collectionRequestId,
    });

    return { collectionRequest, bags };
  }

  /**
   * Tenta, por esta ordem: UUID da solicitação, código amigável da solicitação,
   * token do saco, código amigável do saco. A ordem importa — o UUID é o caso
   * barato e os códigos de saco são os menos frequentes.
   */
  private async resolve(identifier: string): Promise<string> {
    const value = identifier.trim();

    if (isUuid(value)) {
      return value;
    }

    const byCollectionRequest = await this.collectionRequestRepository.findOne({
      friendlyCode: value,
    } as Partial<CollectionRequest>);
    if (byCollectionRequest) {
      return byCollectionRequest.id;
    }

    const byToken = await this.collectionRequestBagRepository.findOne({
      token: value,
    });
    if (byToken?.collectionRequestId) {
      return byToken.collectionRequestId;
    }

    const byBagCode = await this.collectionRequestBagRepository.findOne({
      friendlyCode: value,
    });
    if (byBagCode?.collectionRequestId) {
      return byBagCode.collectionRequestId;
    }

    throw new NotFoundException('errors.collection.requestNotFound');
  }
}
