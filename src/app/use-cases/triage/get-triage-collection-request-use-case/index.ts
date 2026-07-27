import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CollectionRequest } from '../../../../domain/collection-request/collection-request.entity';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { QrCode } from '../../../../domain/qr-code/qr-code.entity';
import { IQrCodeRepository } from '../../../../domain/qr-code/qr-code.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

export interface TriageCollectionRequestResult {
  collectionRequest: CollectionRequest;
  qrCodes: QrCode[];
}

/**
 * Consulta o pacote para triagem pelo código amigável da solicitação OU pelo
 * token/código amigável de um QR (volume). Retorna o pacote com relações e a
 * lista de volumes (QR codes) do pacote.
 */
@Injectable()
export class GetTriageCollectionRequestUseCase
  implements IUseCase<string, TriageCollectionRequestResult>
{
  constructor(
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY)
    private readonly collectionRequestRepository: ICollectionRequestRepository,
    @Inject(DOMAIN_TOKENS.QR_CODE_REPOSITORY)
    private readonly qrCodeRepository: IQrCodeRepository,
  ) {}

  async call(code: string): Promise<TriageCollectionRequestResult> {
    let collectionRequestId: string | undefined;

    // 1. Tenta pelo código amigável da solicitação.
    const byCollectionRequest = await this.collectionRequestRepository.findOne({
      friendlyCode: code,
    } as Partial<CollectionRequest>);
    if (byCollectionRequest) {
      collectionRequestId = byCollectionRequest.id;
    } else {
      // 2. Tenta por um QR (token ou código amigável) → sua solicitação.
      let qr = await this.qrCodeRepository.findOne({ token: code });
      if (!qr) {
        qr = await this.qrCodeRepository.findOne({ friendlyCode: code });
      }
      if (qr?.collectionRequestId) {
        collectionRequestId = qr.collectionRequestId;
      }
    }

    if (!collectionRequestId) {
      throw new NotFoundException(
        'Nenhuma solicitação encontrada para o código informado',
      );
    }

    const collectionRequestEntity =
      await this.collectionRequestRepository.findOneWithAllRelations(collectionRequestId);
    if (!collectionRequestEntity) {
      throw new NotFoundException('Solicitação não encontrada');
    }

    const qrCodes = await this.qrCodeRepository.find({ collectionRequestId });
    return { collectionRequest: collectionRequestEntity, qrCodes };
  }
}
