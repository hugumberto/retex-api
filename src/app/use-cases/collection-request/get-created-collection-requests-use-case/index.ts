import { Inject, Injectable } from '@nestjs/common';
import { PaginatedResult } from '../../../../domain/interfaces/pagination.interface';
import { CollectionRequest, CollectionRequestStatus } from '../../../../domain/collection-request/collection-request.entity';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { GetCreatedCollectionRequestsDto } from './get-created-collection-requests.dto';

@Injectable()
export class GetCreatedCollectionRequestsUseCase implements IUseCase<GetCreatedCollectionRequestsDto, PaginatedResult<CollectionRequest>> {
  constructor(
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY)
    private readonly collectionRequestRepository: ICollectionRequestRepository,
  ) { }

  async call(param: GetCreatedCollectionRequestsDto): Promise<PaginatedResult<CollectionRequest>> {
    const filters = {
      status: CollectionRequestStatus.CREATED,
      unrouted: true,
    };

    const pagination = {
      page: param.page || 1,
      limit: param.limit || 1000,
    };

    return this.collectionRequestRepository.findByFiltersWithPagination(filters, pagination);
  }
} 