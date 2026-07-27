import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CollectionRequest } from '../../../../domain/collection-request/collection-request.entity';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { QrCode } from '../../../../domain/qr-code/qr-code.entity';
import { IQrCodeRepository } from '../../../../domain/qr-code/qr-code.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

/**
 * Desassocia um volume (QR code) do seu pacote: limpa collection_request_id/used_at (o QR
 * volta ao pool da rota) e recalcula o nº de volumes do pacote.
 */
@Injectable()
export class UnassignQrCodeUseCase implements IUseCase<string, QrCode> {
  constructor(
    @Inject(DOMAIN_TOKENS.QR_CODE_REPOSITORY)
    private readonly qrCodeRepository: IQrCodeRepository,
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY)
    private readonly collectionRequestRepository: ICollectionRequestRepository,
  ) {}

  async call(qrCodeId: string): Promise<QrCode> {
    const qr = await this.qrCodeRepository.findOne({ id: qrCodeId });
    if (!qr) {
      throw new NotFoundException('Volume não encontrado');
    }

    const previousCollectionRequestId = qr.collectionRequestId;

    const [updated] = await this.qrCodeRepository.update(
      { id: qrCodeId },
      { collectionRequestId: null, usedAt: null } as Partial<QrCode>,
    );

    if (previousCollectionRequestId) {
      await this.syncCollectionRequestVolumes(previousCollectionRequestId);
    }

    return updated ?? qr;
  }

  // Recalcula qr_codes_generated do pacote a partir dos volumes ativos.
  private async syncCollectionRequestVolumes(collectionRequestId: string): Promise<void> {
    const remaining = await this.qrCodeRepository.find({ collectionRequestId });
    await this.collectionRequestRepository.update(
      { id: collectionRequestId } as Partial<CollectionRequest>,
      { qrCodesGenerated: remaining.length } as Partial<CollectionRequest>,
    );
  }
}
