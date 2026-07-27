import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Package } from '../../../../domain/package/package.entity';
import { IPackageRepository } from '../../../../domain/package/package.repository';
import { QrCode } from '../../../../domain/qr-code/qr-code.entity';
import { IQrCodeRepository } from '../../../../domain/qr-code/qr-code.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface PackageVolumesResult {
  package: Pick<
    Package,
    'id' | 'friendlyCode' | 'status' | 'estimatedVolumes' | 'qrCodesGenerated'
  >;
  volumes: QrCode[];
}

/**
 * Lista os volumes (QR codes) de um pacote, resolvido por UUID ou código
 * amigável. Usado na tela de gestão de volumes.
 */
@Injectable()
export class GetPackageVolumesUseCase
  implements IUseCase<string, PackageVolumesResult>
{
  constructor(
    @Inject(DOMAIN_TOKENS.PACKAGE_REPOSITORY)
    private readonly packageRepository: IPackageRepository,
    @Inject(DOMAIN_TOKENS.QR_CODE_REPOSITORY)
    private readonly qrCodeRepository: IQrCodeRepository,
  ) {}

  async call(identifier: string): Promise<PackageVolumesResult> {
    const value = identifier.trim();

    const pkg = UUID_REGEX.test(value)
      ? await this.packageRepository.findOne({ id: value } as Partial<Package>)
      : await this.packageRepository.findOne({
          friendlyCode: value,
        } as Partial<Package>);

    if (!pkg) {
      throw new NotFoundException('Solicitação não encontrada');
    }

    const volumes = await this.qrCodeRepository.find({ packageId: pkg.id });

    return {
      package: {
        id: pkg.id,
        friendlyCode: pkg.friendlyCode,
        status: pkg.status,
        estimatedVolumes: pkg.estimatedVolumes,
        qrCodesGenerated: pkg.qrCodesGenerated,
      },
      volumes,
    };
  }
}
