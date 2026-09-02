import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CollectionRequest } from '../../../../domain/collection-request/collection-request.entity';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { CollectionRequestBag } from '../../../../domain/collection-request-bag/collection-request-bag.entity';
import { ICollectionRequestBagRepository } from '../../../../domain/collection-request-bag/collection-request-bag.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import {
  generateBatchId,
  generateToken,
  generateUniqueFriendlyCode,
} from '../bag.util';

export interface CreateCollectionRequestBagParams {
  collectionRequestId: string;
}

/**
 * Cria um saco já vinculado a uma solicitação, sem passar pelo pool da rota.
 *
 * O caminho normal é `BindQrCodeUseCase`: os sacos são gerados por rota na
 * entrada em IN_TRANSIT e o motorista lê o QR impresso. Isto é a saída de
 * emergência do MASTER para quando não há etiqueta disponível (acabaram, ou o
 * saco apareceu depois da recolha fechar) — daí não haver verificação de
 * estado. Quem restringe ao MASTER é o `@Roles` do endpoint.
 */
@Injectable()
export class CreateCollectionRequestBagUseCase
  implements IUseCase<CreateCollectionRequestBagParams, CollectionRequestBag>
{
  constructor(
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY)
    private readonly collectionRequestRepository: ICollectionRequestRepository,
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_BAG_REPOSITORY)
    private readonly collectionRequestBagRepository: ICollectionRequestBagRepository,
  ) {}

  async call({
    collectionRequestId,
  }: CreateCollectionRequestBagParams): Promise<CollectionRequestBag> {
    const collectionRequest =
      await this.collectionRequestRepository.findOneWithAllRelations(
        collectionRequestId,
      );
    if (!collectionRequest) {
      throw new NotFoundException('errors.collection.requestNotFound');
    }

    const friendlyCode = await generateUniqueFriendlyCode(
      new Date().getFullYear(),
      async (code) =>
        !!(await this.collectionRequestBagRepository.findOne({
          friendlyCode: code,
        })),
    );

    const bag = await this.collectionRequestBagRepository.create({
      token: generateToken(),
      friendlyCode,
      // Lote próprio: não pertence a nenhuma geração da rota.
      batchId: generateBatchId(),
      // A rota da solicitação, quando existe — é o que faz o saco aparecer
      // junto dos restantes da rota (impressão, limpeza dos não usados).
      routeId: collectionRequest.route?.id ?? null,
      collectionRequestId,
      // Nasce já utilizado: foi criado por causa de um saco que existe.
      usedAt: new Date(),
    });

    await this.syncCollectionRequestBags(collectionRequestId);

    return bag;
  }

  // Mesmo recálculo do unassign/delete: bags_generated segue os sacos ativos.
  private async syncCollectionRequestBags(
    collectionRequestId: string,
  ): Promise<void> {
    const bags = await this.collectionRequestBagRepository.find({
      collectionRequestId,
    });
    await this.collectionRequestRepository.update(
      { id: collectionRequestId } as Partial<CollectionRequest>,
      { bagsGenerated: bags.length } as Partial<CollectionRequest>,
    );
  }
}
