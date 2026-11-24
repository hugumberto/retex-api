import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

/** O que a página do link de confirmação mostra antes de o cliente carregar em Confirmar. */
export type CollectionConfirmationView = {
  code: string | null;
  firstName: string | null;
  start: Date | null;
  // Janela da rota ("09:00 - 13:00").
  interval: string | null;
  estimatedBags: number | null;
  street: string | null;
  city: string | null;
};

/**
 * Só lê: abrir o link não confirma nada. Antes, a página confirmava logo ao
 * abrir, e os leitores de email que abrem os links para os verificar
 * confirmavam recolhas sem o cliente carregar em nada.
 */
@Injectable()
export class GetCollectionConfirmationUseCase
  implements IUseCase<{ token: string }, CollectionConfirmationView>
{
  constructor(
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY)
    private readonly collectionRequestRepository: ICollectionRequestRepository,
  ) {}

  async call({ token }: { token: string }): Promise<CollectionConfirmationView> {
    const request = token
      ? await this.collectionRequestRepository.findByCollectionConfirmationToken(token)
      : null;
    if (!request) throw new NotFoundException('errors.auth.confirmationTokenInvalid');
    return {
      code: request.friendlyCode ?? null,
      firstName: request.user?.firstName ?? null,
      start: request.route?.startDate ?? null,
      interval: request.route?.collectionInterval ?? null,
      estimatedBags: request.estimatedBags ?? null,
      street: [request.address?.street, request.address?.number].filter(Boolean).join(' ') || null,
      city: request.address?.city ?? null,
    };
  }
}
