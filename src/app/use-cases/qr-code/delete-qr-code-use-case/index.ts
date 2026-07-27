import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CollectionRequest } from '../../../../domain/collection-request/collection-request.entity';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { QrCode } from '../../../../domain/qr-code/qr-code.entity';
import { IQrCodeRepository } from '../../../../domain/qr-code/qr-code.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

/**
 * Elimina (soft-delete) um volume (QR code) e recalcula o nº de volumes do
 * pacote a que estava associado.
 */
@Injectable()
export class DeleteQrCodeUseCase implements IUseCase<string, QrCode> {
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

    const collectionRequestId = qr.collectionRequestId;

    const deleted = await this.qrCodeRepository.delete({ id: qrCodeId });

    if (collectionRequestId) {
      const remaining = await this.qrCodeRepository.find({ collectionRequestId });
      await this.collectionRequestRepository.update(
        { id: collectionRequestId } as Partial<CollectionRequest>,
        { qrCodesGenerated: remaining.length } as Partial<CollectionRequest>,
      );
    }

    return deleted;
  }
}
