import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CollectionRequest } from '../../../../domain/collection-request/collection-request.entity';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

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
  ) {}

  async call(param: GetCollectionRequestByIdParam): Promise<CollectionRequest> {
    const pkg = await this.collectionRequestRepository.findOneWithAllRelations(param.id);

    if (!pkg) {
      throw new NotFoundException('CollectionRequest não encontrado');
    }

    // USER só pode ver os próprios pacotes; ADMIN/OPS veem todos.
    // Devolvemos 404 (e não 403) para não revelar a existência a terceiros.
    if (!param.isPrivileged && pkg.user?.id !== param.requesterId) {
      throw new NotFoundException('CollectionRequest não encontrado');
    }

    return pkg;
  }
}
