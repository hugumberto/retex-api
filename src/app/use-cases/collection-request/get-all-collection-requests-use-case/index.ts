import { Inject, Injectable } from '@nestjs/common';
import { CollectionRequest } from '../../../../domain/collection-request/collection-request.entity';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

@Injectable()
export class GetAllCollectionRequestsUseCase implements IUseCase<void, CollectionRequest[]> {
  constructor(
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY)
    private readonly collectionRequestRepository: ICollectionRequestRepository,
  ) {}

  async call(): Promise<CollectionRequest[]> {
    return this.collectionRequestRepository.findAll();
  }
}
