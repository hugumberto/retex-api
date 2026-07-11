import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Package } from '../../../../domain/package/package.entity';
import { IPackageRepository } from '../../../../domain/package/package.repository';
import { QrCode } from '../../../../domain/qr-code/qr-code.entity';
import { IQrCodeRepository } from '../../../../domain/qr-code/qr-code.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

export interface CollectionResult {
  package: Package;
  qrCodes: QrCode[];
}

@Injectable()
export class GetCollectionUseCase implements IUseCase<string, CollectionResult> {
  constructor(
    @Inject(DOMAIN_TOKENS.PACKAGE_REPOSITORY)
    private readonly packageRepository: IPackageRepository,
    @Inject(DOMAIN_TOKENS.QR_CODE_REPOSITORY)
    private readonly qrCodeRepository: IQrCodeRepository,
  ) { }

  async call(packageId: string): Promise<CollectionResult> {
    const packageEntity =
      await this.packageRepository.findOneWithAllRelations(packageId);
    if (!packageEntity) {
      throw new NotFoundException('Solicitação não encontrada');
    }

    const qrCodes = await this.qrCodeRepository.find({ packageId });
    return { package: packageEntity, qrCodes };
  }
}
