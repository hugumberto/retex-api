import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PackageStatus } from '../../../../domain/package/package.entity';
import { IPackageRepository } from '../../../../domain/package/package.repository';
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
    @Inject(DOMAIN_TOKENS.PACKAGE_REPOSITORY)
    private readonly packageRepository: IPackageRepository,
  ) {}

  async call({ qrCodeId, weight }: ProcessTriageQrParams): Promise<QrCode> {
    const qrCode = await this.qrCodeRepository.findOne({ id: qrCodeId });
    if (!qrCode) {
      throw new NotFoundException('QR code não encontrado');
    }
    if (!qrCode.packageId) {
      throw new BadRequestException(
        'O QR code não está vinculado a uma solicitação',
      );
    }

    const packageEntity = await this.packageRepository.findOne({
      id: qrCode.packageId,
    });
    if (!packageEntity) {
      throw new NotFoundException('Solicitação não encontrada');
    }
    if (
      packageEntity.status !== PackageStatus.COLLECTED &&
      packageEntity.status !== PackageStatus.SCREENING
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
      packageId: qrCode.packageId,
    });
    const totalWeight = qrCodes.reduce(
      (sum, code) => sum + Number(code.weight ?? 0),
      0,
    );
    await this.packageRepository.update(
      { id: qrCode.packageId },
      { weight: totalWeight, status: PackageStatus.SCREENING },
    );

    return updatedQr;
  }
}
