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

// Deteta se o identificador recebido é um UUID (id do pacote) ou não — caso não
// seja, assume-se o código amigável (`ano-XXXXXX`).
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class GetCollectionUseCase implements IUseCase<string, CollectionResult> {
  constructor(
    @Inject(DOMAIN_TOKENS.PACKAGE_REPOSITORY)
    private readonly packageRepository: IPackageRepository,
    @Inject(DOMAIN_TOKENS.QR_CODE_REPOSITORY)
    private readonly qrCodeRepository: IQrCodeRepository,
  ) { }

  async call(identifier: string): Promise<CollectionResult> {
    const packageId = await this.resolvePackageId(identifier);

    const packageEntity =
      await this.packageRepository.findOneWithAllRelations(packageId);
    if (!packageEntity) {
      throw new NotFoundException('Solicitação não encontrada');
    }

    const qrCodes = await this.qrCodeRepository.find({ packageId });
    return { package: packageEntity, qrCodes };
  }

  // Aceita o id (UUID) ou o código amigável do pacote e devolve o id.
  private async resolvePackageId(identifier: string): Promise<string> {
    const value = identifier.trim();

    if (UUID_REGEX.test(value)) {
      return value;
    }

    const byFriendlyCode = await this.packageRepository.findOne({
      friendlyCode: value,
    } as Partial<Package>);

    if (!byFriendlyCode) {
      throw new NotFoundException('Solicitação não encontrada');
    }

    return byFriendlyCode.id;
  }
}
