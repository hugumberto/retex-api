import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Package } from '../../../../domain/package/package.entity';
import { IPackageRepository } from '../../../../domain/package/package.repository';
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
    @Inject(DOMAIN_TOKENS.PACKAGE_REPOSITORY)
    private readonly packageRepository: IPackageRepository,
  ) {}

  async call(qrCodeId: string): Promise<QrCode> {
    const qr = await this.qrCodeRepository.findOne({ id: qrCodeId });
    if (!qr) {
      throw new NotFoundException('Volume não encontrado');
    }

    const packageId = qr.packageId;

    const deleted = await this.qrCodeRepository.delete({ id: qrCodeId });

    if (packageId) {
      const remaining = await this.qrCodeRepository.find({ packageId });
      await this.packageRepository.update(
        { id: packageId } as Partial<Package>,
        { qrCodesGenerated: remaining.length } as Partial<Package>,
      );
    }

    return deleted;
  }
}
