import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CollectionRequest } from '../../../../domain/collection-request/collection-request.entity';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { CompanyContextService } from '../../../services/company-context/company-context.service';
import { IUseCase } from '../../interfaces/use-case.interface';
import { canAccessCollectionRequest } from '../../shared/collection-request-access.util';

export interface GetCollectionRequestByIdParam {
  id: string;
  requesterId: string;
  isPrivileged: boolean;
}

@Injectable()
export class GetCollectionRequestByIdUseCase implements IUseCase<GetCollectionRequestByIdParam, CollectionRequest> {
  constructor(
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY)
    private readonly collectionRequestRepository: ICollectionRequestRepository,
    private readonly companyContextService: CompanyContextService,
  ) {}

  async call(param: GetCollectionRequestByIdParam): Promise<CollectionRequest> {
    const pkg = await this.collectionRequestRepository.findOneWithAllRelations(param.id);

    if (!pkg) {
      throw new NotFoundException('errors.collectionRequest.notFound');
    }

    const companyContext = await this.companyContextService.resolve(
      param.requesterId,
    );

    // USER só vê os próprios pacotes; o gestor de empresa vê os da sua empresa;
    // ADMIN/OPS veem todos.
    // Devolvemos 404 (e não 403) para não revelar a existência a terceiros.
    if (
      !canAccessCollectionRequest(
        pkg,
        param.requesterId,
        param.isPrivileged,
        companyContext,
      )
    ) {
      throw new NotFoundException('errors.collectionRequest.notFound');
    }

    return pkg;
  }
}
