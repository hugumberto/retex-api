import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Package, PackageStatus } from '../../../../domain/package/package.entity';
import { IPackageRepository } from '../../../../domain/package/package.repository';
import { IQrCodeRepository } from '../../../../domain/qr-code/qr-code.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { FinishRouteIfAllCollectedUseCase } from '../../route/finish-route-if-all-collected-use-case';

@Injectable()
export class FinalizeCollectionUseCase implements IUseCase<string, Package> {
  private readonly logger = new Logger(FinalizeCollectionUseCase.name);

  constructor(
    @Inject(DOMAIN_TOKENS.PACKAGE_REPOSITORY)
    private readonly packageRepository: IPackageRepository,
    @Inject(DOMAIN_TOKENS.QR_CODE_REPOSITORY)
    private readonly qrCodeRepository: IQrCodeRepository,
    private readonly finishRouteIfAllCollectedUseCase: FinishRouteIfAllCollectedUseCase,
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

    // Se todos os pacotes da rota já foram coletados/cancelados, a rota fecha.
    const withRoute =
      await this.packageRepository.findOneWithAllRelations(packageId);
    const routeId = withRoute?.route?.id;
    if (routeId) {
      this.finishRouteIfAllCollectedUseCase
        .call(routeId)
        .catch((err) =>
          this.logger.error(
            `Falha ao tentar finalizar a rota ${routeId}: ${err.message}`,
          ),
        );
    }

    return updated;
  }
}
