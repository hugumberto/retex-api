import { Inject, Injectable } from '@nestjs/common';
import { CollectionRequestBag } from '../../../../domain/collection-request-bag/collection-request-bag.entity';
import { ICollectionRequestBagRepository } from '../../../../domain/collection-request-bag/collection-request-bag.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

/**
 * Lista os QR codes gerados para uma rota (para impressão).
 */
@Injectable()
export class GetRouteBagsUseCase implements IUseCase<string, CollectionRequestBag[]> {
  constructor(
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_BAG_REPOSITORY)
    private readonly collectionRequestBagRepository: ICollectionRequestBagRepository,
  ) {}

  async call(routeId: string): Promise<CollectionRequestBag[]> {
    return this.collectionRequestBagRepository.findByRoute(routeId);
  }
}
