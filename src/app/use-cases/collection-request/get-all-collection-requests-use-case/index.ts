import { Inject, Injectable } from '@nestjs/common';
import { CollectionRequest } from '../../../../domain/collection-request/collection-request.entity';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { PaginatedResult } from '../../../../domain/interfaces/pagination.interface';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { GetCollectionRequestsDto } from './get-collection-requests.dto';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 1000;

/**
 * Listagem paginada de solicitações de recolha, com os filtros que o repositório
 * já suportava (`status`, `unrouted`).
 *
 * Substitui o antigo `findAll()` sem paginação e absorve o
 * `GetCreatedCollectionRequestsUseCase`, que era este mesmo caso com
 * `{status: CREATED, unrouted: true}` cravado no código.
 */
@Injectable()
export class GetAllCollectionRequestsUseCase
  implements
    IUseCase<
      GetCollectionRequestsDto | undefined,
      PaginatedResult<CollectionRequest>
    >
{
  constructor(
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY)
    private readonly collectionRequestRepository: ICollectionRequestRepository,
  ) { }

  async call(
    param?: GetCollectionRequestsDto,
  ): Promise<PaginatedResult<CollectionRequest>> {
    return this.collectionRequestRepository.findByFiltersWithPagination(
      {
        status: param?.status,
        unrouted: param?.unrouted,
        companyId: param?.companyId,
        userId: param?.userId,
      },
      {
        page: param?.page || DEFAULT_PAGE,
        limit: param?.limit || DEFAULT_LIMIT,
      },
    );
  }
}
