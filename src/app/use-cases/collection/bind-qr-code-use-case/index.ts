import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CollectionRequestStatus } from '../../../../domain/collection-request/collection-request.entity';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { CollectionRequestBag } from '../../../../domain/collection-request-bag/collection-request-bag.entity';
import { ICollectionRequestBagRepository } from '../../../../domain/collection-request-bag/collection-request-bag.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { BindQrCodeDto } from './bind-qr-code.dto';

export { BindQrCodeDto };

export interface BindQrCodeParams {
  collectionRequestId: string;
  code: string;
}

@Injectable()
export class BindQrCodeUseCase implements IUseCase<BindQrCodeParams, CollectionRequestBag> {
  constructor(
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY)
    private readonly collectionRequestRepository: ICollectionRequestRepository,
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_BAG_REPOSITORY)
    private readonly collectionRequestBagRepository: ICollectionRequestBagRepository,
  ) { }

  async call({ collectionRequestId, code }: BindQrCodeParams): Promise<CollectionRequestBag> {
    const collectionRequestEntity =
      await this.collectionRequestRepository.findOneWithAllRelations(collectionRequestId);
    if (!collectionRequestEntity) {
      throw new NotFoundException('errors.collection.requestNotFound');
    }
    if (collectionRequestEntity.status !== CollectionRequestStatus.WAITING_FOR_COLLECTION) {
      throw new BadRequestException('errors.collection.notAwaitingPickup');
    }

    // Aceita o token (escaneado) ou o código amigável (digitado).
    let bag = await this.collectionRequestBagRepository.findOne({ token: code });
    if (!bag) {
      bag = await this.collectionRequestBagRepository.findOne({ friendlyCode: code });
    }
    if (!bag) {
      throw new NotFoundException('errors.qrCode.notFound');
    }
    if (bag.usedAt || bag.collectionRequestId) {
      throw new ConflictException('errors.qrCode.alreadyUsed');
    }
    // O QR pertence à rota do pacote (os códigos são gerados por rota) — evita
    // vincular um QR de outra rota.
    if (
      bag.routeId &&
      collectionRequestEntity.route?.id &&
      bag.routeId !== collectionRequestEntity.route.id
    ) {
      throw new BadRequestException('errors.qrCode.wrongRoute');
    }

    const [updated] = await this.collectionRequestBagRepository.update(
      { id: bag.id },
      { collectionRequestId, usedAt: new Date() },
    );
    return updated;
  }
}
