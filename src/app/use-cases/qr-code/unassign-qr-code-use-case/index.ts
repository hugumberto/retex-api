import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Package } from '../../../../domain/package/package.entity';
import { IPackageRepository } from '../../../../domain/package/package.repository';
import { QrCode } from '../../../../domain/qr-code/qr-code.entity';
import { IQrCodeRepository } from '../../../../domain/qr-code/qr-code.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

/**
 * Desassocia um volume (QR code) do seu pacote: limpa package_id/used_at (o QR
 * volta ao pool da rota) e recalcula o nº de volumes do pacote.
 */
@Injectable()
export class UnassignQrCodeUseCase implements IUseCase<string, QrCode> {
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

    const previousPackageId = qr.packageId;

    const [updated] = await this.qrCodeRepository.update(
      { id: qrCodeId },
      { packageId: null, usedAt: null } as Partial<QrCode>,
    );

    if (previousPackageId) {
      await this.syncPackageVolumes(previousPackageId);
    }

    return updated ?? qr;
  }

  // Recalcula qr_codes_generated do pacote a partir dos volumes ativos.
  private async syncPackageVolumes(packageId: string): Promise<void> {
    const remaining = await this.qrCodeRepository.find({ packageId });
    await this.packageRepository.update(
      { id: packageId } as Partial<Package>,
      { qrCodesGenerated: remaining.length } as Partial<Package>,
    );
  }
}
