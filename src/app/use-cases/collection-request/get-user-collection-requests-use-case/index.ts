import { Inject, Injectable } from '@nestjs/common';
import { CollectionRequest } from '../../../../domain/collection-request/collection-request.entity';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { CompanyPermission } from '../../../../domain/company/company-profile.entity';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { CompanyContextService } from '../../../services/company-context/company-context.service';
import { IUseCase } from '../../interfaces/use-case.interface';

const COMPANY_LIST_LIMIT = 1000;

/**
 * Solicitações visíveis ao utilizador autenticado.
 *
 * Para um particular (e para um colaborador de empresa) são as que criou. Para
 * quem tem `REQUEST_VIEW_ALL` — o gestor — são todas as da sua empresa, que é
 * o que lhe permite acompanhar a operação que paga.
 */
@Injectable()
export class GetUserCollectionRequestsUseCase implements IUseCase<{ userId: string }, CollectionRequest[]> {
  constructor(
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY)
    private readonly collectionRequestRepository: ICollectionRequestRepository,
    private readonly companyContextService: CompanyContextService,
  ) {}

  async call(param: { userId: string }): Promise<CollectionRequest[]> {
    const companyContext = await this.companyContextService.resolve(
      param.userId,
    );

    if (
      CompanyContextService.can(
        companyContext,
        CompanyPermission.REQUEST_VIEW_ALL,
      )
    ) {
      const page =
        await this.collectionRequestRepository.findByFiltersWithPagination(
          { companyId: companyContext.companyId },
          { page: 1, limit: COMPANY_LIST_LIMIT },
        );
      return page.data;
    }

    return this.collectionRequestRepository.findByUser(param.userId);
  }
}
