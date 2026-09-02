import { ForbiddenException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CollectionRequest, CollectionRequestStatus } from '../../../../domain/collection-request/collection-request.entity';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { CompanyContextService } from '../../../services/company-context/company-context.service';
import { IUseCase } from '../../interfaces/use-case.interface';
import { canCancelCollectionRequest } from '../../shared/collection-request-access.util';
import { FinishRouteIfAllCollectedUseCase } from '../../route/finish-route-if-all-collected-use-case';
import { UpdateCollectionRequestDto } from './update-collection-request.dto';

export interface UpdateCollectionRequestParamDto {
  id: string;
  data: UpdateCollectionRequestDto;
  requesterId: string;
  isPrivileged: boolean;
}

@Injectable()
export class UpdateCollectionRequestUseCase
  implements IUseCase<UpdateCollectionRequestParamDto, CollectionRequest>
{
  private readonly logger = new Logger(UpdateCollectionRequestUseCase.name);

  constructor(
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY)
    private readonly collectionRequestRepository: ICollectionRequestRepository,
    private readonly finishRouteIfAllCollectedUseCase: FinishRouteIfAllCollectedUseCase,
    private readonly companyContextService: CompanyContextService,
  ) {}

  async call(param: UpdateCollectionRequestParamDto): Promise<CollectionRequest> {
    const { id, data, requesterId, isPrivileged } = param;

    const existingCollectionRequest = await this.collectionRequestRepository.findOneWithAllRelations(id);
    if (!existingCollectionRequest) {
      throw new NotFoundException('errors.collectionRequest.notFound');
    }

    // USER só pode mexer nos próprios pacotes e apenas para CANCELAR. O gestor
    // de empresa alcança também os dos colaboradores, mas com o mesmo limite:
    // cancelar, nada mais.
    if (!isPrivileged) {
      const companyContext = await this.companyContextService.resolve(requesterId);

      if (
        !canCancelCollectionRequest(
          existingCollectionRequest,
          requesterId,
          isPrivileged,
          companyContext,
        )
      ) {
        throw new NotFoundException('errors.collectionRequest.notFound');
      }
      if (data.status !== CollectionRequestStatus.CANCELLED) {
        throw new ForbiddenException('errors.collection.cancelOnlyOwn',
        );
      }
    }

    const updateData: Partial<CollectionRequest> = {};

    if (data.status) {
      updateData.status = data.status;
    }

    // Peso só é definido por operadores (triagem), não pelo utilizador.
    if (isPrivileged && data.weight && data.weight > 0) {
      updateData.weight = data.weight;
    }

    if (Object.keys(updateData).length === 0) {
      return existingCollectionRequest;
    }

    const [updatedCollectionRequest] = await this.collectionRequestRepository.update(
      { id },
      updateData,
    );

    // Cancelamento pode fechar a rota (todos coletados/cancelados).
    if (
      data.status === CollectionRequestStatus.CANCELLED &&
      existingCollectionRequest.route?.id
    ) {
      const routeId = existingCollectionRequest.route.id;
      this.finishRouteIfAllCollectedUseCase
        .call(routeId)
        .catch((err) =>
          this.logger.error(
            `Falha ao tentar finalizar a rota ${routeId}: ${err.message}`,
          ),
        );
    }

    return updatedCollectionRequest;
  }
}
