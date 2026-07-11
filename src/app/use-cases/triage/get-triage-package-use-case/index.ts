import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Package } from '../../../../domain/package/package.entity';
import { IPackageRepository } from '../../../../domain/package/package.repository';
import { QrCode } from '../../../../domain/qr-code/qr-code.entity';
import { IQrCodeRepository } from '../../../../domain/qr-code/qr-code.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

export interface TriagePackageResult {
  package: Package;
  qrCodes: QrCode[];
}

/**
 * Consulta o pacote para triagem pelo código amigável da solicitação OU pelo
 * token/código amigável de um QR (volume). Retorna o pacote com relações e a
 * lista de volumes (QR codes) do pacote.
 */
@Injectable()
export class GetTriagePackageUseCase
  implements IUseCase<string, TriagePackageResult>
{
  constructor(
    @Inject(DOMAIN_TOKENS.PACKAGE_REPOSITORY)
    private readonly packageRepository: IPackageRepository,
    @Inject(DOMAIN_TOKENS.QR_CODE_REPOSITORY)
    private readonly qrCodeRepository: IQrCodeRepository,
  ) {}

  async call(code: string): Promise<TriagePackageResult> {
    let packageId: string | undefined;

    // 1. Tenta pelo código amigável da solicitação.
    const byPackage = await this.packageRepository.findOne({
      friendlyCode: code,
    } as Partial<Package>);
    if (byPackage) {
      packageId = byPackage.id;
    } else {
      // 2. Tenta por um QR (token ou código amigável) → sua solicitação.
      let qr = await this.qrCodeRepository.findOne({ token: code });
      if (!qr) {
        qr = await this.qrCodeRepository.findOne({ friendlyCode: code });
      }
      if (qr?.packageId) {
        packageId = qr.packageId;
      }
    }

    if (!packageId) {
      throw new NotFoundException(
        'Nenhuma solicitação encontrada para o código informado',
      );
    }

    const packageEntity =
      await this.packageRepository.findOneWithAllRelations(packageId);
    if (!packageEntity) {
      throw new NotFoundException('Solicitação não encontrada');
    }

    const qrCodes = await this.qrCodeRepository.find({ packageId });
    return { package: packageEntity, qrCodes };
  }
}
