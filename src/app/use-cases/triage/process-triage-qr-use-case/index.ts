import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CollectionRequestStatus } from '../../../../domain/collection-request/collection-request.entity';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { QrCode } from '../../../../domain/qr-code/qr-code.entity';
import { IQrCodeRepository } from '../../../../domain/qr-code/qr-code.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

export interface ProcessTriageQrParams {
  qrCodeId: string;
  weight: number;
}

/**
 * Processa um volume (QR code) na triagem: grava o peso do volume, marca-o como
 * processado e recalcula o peso do pacote como a soma dos pesos dos volumes.
 * A solicitação passa (ou permanece) em SCREENING. Os itens do volume são
 * criados/removidos pelos endpoints de item (com o qrCodeId).
 */
@Injectable()
export class ProcessTriageQrUseCase
  implements IUseCase<ProcessTriageQrParams, QrCode>
{
  constructor(
    @Inject(DOMAIN_TOKENS.QR_CODE_REPOSITORY)
    private readonly qrCodeRepository: IQrCodeRepository,
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY)
    private readonly collectionRequestRepository: ICollectionRequestRepository,
  ) {}

  async call({ qrCodeId, weight }: ProcessTriageQrParams): Promise<QrCode> {
    const qrCode = await this.qrCodeRepository.findOne({ id: qrCodeId });
    if (!qrCode) {
      throw new NotFoundException('QR code não encontrado');
    }
    if (!qrCode.collectionRequestId) {
      throw new BadRequestException(
        'O QR code não está vinculado a uma solicitação',
      );
    }

    const collectionRequestEntity = await this.collectionRequestRepository.findOne({
      id: qrCode.collectionRequestId,
    });
    if (!collectionRequestEntity) {
      throw new NotFoundException('Solicitação não encontrada');
    }
    if (
      collectionRequestEntity.status !== CollectionRequestStatus.COLLECTED &&
      collectionRequestEntity.status !== CollectionRequestStatus.SCREENING
    ) {
      throw new BadRequestException(
        'A solicitação não está em coleta/triagem',
      );
    }

    const [updatedQr] = await this.qrCodeRepository.update(
      { id: qrCodeId },
      { weight, processedAt: new Date() },
    );

    // Peso do pacote = soma dos pesos dos volumes (decimais vêm como string).
    const qrCodes = await this.qrCodeRepository.find({
      collectionRequestId: qrCode.collectionRequestId,
    });
    const totalWeight = qrCodes.reduce(
      (sum, code) => sum + Number(code.weight ?? 0),
      0,
    );
    await this.collectionRequestRepository.update(
      { id: qrCode.collectionRequestId },
      { weight: totalWeight, status: CollectionRequestStatus.SCREENING },
    );

    return updatedQr;
  }
}
