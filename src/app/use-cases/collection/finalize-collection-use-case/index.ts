import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Package, PackageStatus } from '../../../../domain/package/package.entity';
import { IPackageRepository } from '../../../../domain/package/package.repository';
import { IQrCodeRepository } from '../../../../domain/qr-code/qr-code.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

@Injectable()
export class FinalizeCollectionUseCase implements IUseCase<string, Package> {
  constructor(
    @Inject(DOMAIN_TOKENS.PACKAGE_REPOSITORY)
    private readonly packageRepository: IPackageRepository,
    @Inject(DOMAIN_TOKENS.QR_CODE_REPOSITORY)
    private readonly qrCodeRepository: IQrCodeRepository,
  ) { }

  async call(packageId: string): Promise<Package> {
    const packageEntity = await this.packageRepository.findOne({ id: packageId });
    if (!packageEntity) {
      throw new NotFoundException('Solicitação não encontrada');
    }
    if (packageEntity.status !== PackageStatus.WAITING_FOR_COLLECTION) {
      throw new BadRequestException('A solicitação não está aguardando recolha');
    }

    const qrCodes = await this.qrCodeRepository.find({ packageId });
    if (qrCodes.length === 0) {
      throw new BadRequestException(
        'Vincule ao menos um volume antes de finalizar a coleta',
      );
    }

    const [updated] = await this.packageRepository.update(
      { id: packageId },
      { status: PackageStatus.COLLECTED },
    );
    return updated;
  }
}
