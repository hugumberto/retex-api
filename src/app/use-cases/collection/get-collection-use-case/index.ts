import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CollectionRequest } from '../../../../domain/collection-request/collection-request.entity';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { QrCode } from '../../../../domain/qr-code/qr-code.entity';
import { IQrCodeRepository } from '../../../../domain/qr-code/qr-code.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

export interface CollectionResult {
  collectionRequest: CollectionRequest;
  qrCodes: QrCode[];
}

// Deteta se o identificador recebido é um UUID (id do pacote) ou não — caso não
// seja, assume-se o código amigável (`ano-XXXXXX`).
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class GetCollectionUseCase implements IUseCase<string, CollectionResult> {
  constructor(
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY)
    private readonly collectionRequestRepository: ICollectionRequestRepository,
    @Inject(DOMAIN_TOKENS.QR_CODE_REPOSITORY)
    private readonly qrCodeRepository: IQrCodeRepository,
  ) { }

  async call(identifier: string): Promise<CollectionResult> {
    const collectionRequestId = await this.resolveCollectionRequestId(identifier);

    const collectionRequestEntity =
      await this.collectionRequestRepository.findOneWithAllRelations(collectionRequestId);
    if (!collectionRequestEntity) {
      throw new NotFoundException('Solicitação não encontrada');
    }

    const qrCodes = await this.qrCodeRepository.find({ collectionRequestId });
    return { collectionRequest: collectionRequestEntity, qrCodes };
  }

  // Aceita o id (UUID) ou o código amigável do pacote e devolve o id.
  private async resolveCollectionRequestId(identifier: string): Promise<string> {
    const value = identifier.trim();

    if (UUID_REGEX.test(value)) {
      return value;
    }

    const byFriendlyCode = await this.collectionRequestRepository.findOne({
      friendlyCode: value,
    } as Partial<CollectionRequest>);

    if (!byFriendlyCode) {
      throw new NotFoundException('Solicitação não encontrada');
    }

    return byFriendlyCode.id;
  }
}
