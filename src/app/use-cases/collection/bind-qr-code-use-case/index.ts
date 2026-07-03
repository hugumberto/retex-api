import {
  BadRequestException,
  ConflictException,
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
import { BindQrCodeDto } from './bind-qr-code.dto';

export { BindQrCodeDto };

export interface BindQrCodeParams {
  packageId: string;
  code: string;
}

@Injectable()
export class BindQrCodeUseCase implements IUseCase<BindQrCodeParams, QrCode> {
  constructor(
    @Inject(DOMAIN_TOKENS.PACKAGE_REPOSITORY)
    private readonly packageRepository: IPackageRepository,
    @Inject(DOMAIN_TOKENS.QR_CODE_REPOSITORY)
    private readonly qrCodeRepository: IQrCodeRepository,
  ) { }

  async call({ packageId, code }: BindQrCodeParams): Promise<QrCode> {
    const packageEntity = await this.packageRepository.findOne({ id: packageId });
    if (!packageEntity) {
      throw new NotFoundException('Solicitação não encontrada');
    }
    if (packageEntity.status !== PackageStatus.WAITING_FOR_COLLECTION) {
      throw new BadRequestException('A solicitação não está aguardando recolha');
    }

    // Aceita o token (escaneado) ou o código amigável (digitado).
    let qrCode = await this.qrCodeRepository.findOne({ token: code });
    if (!qrCode) {
      qrCode = await this.qrCodeRepository.findOne({ friendlyCode: code });
    }
    if (!qrCode) {
      throw new NotFoundException('QR code não encontrado');
    }
    if (qrCode.usedAt || qrCode.packageId) {
      throw new ConflictException('QR code já utilizado');
    }

    const [updated] = await this.qrCodeRepository.update(
      { id: qrCode.id },
      { packageId, usedAt: new Date() },
    );
    return updated;
  }
}
