import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Package, PackageStatus } from '../../../../domain/package/package.entity';
import { IPackageRepository } from '../../../../domain/package/package.repository';
import { RouteStatus } from '../../../../domain/route/route.entity';
import { IRouteRepository } from '../../../../domain/route/route.repository';
import { ISystemParameterRepository } from '../../../../domain/system-parameter/system-parameter.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { ConfirmCollectionDto } from './confirm-collection.dto';

export { ConfirmCollectionDto };

const DEFAULT_CONFIRMATION_DEADLINE_DAYS = 2;

@Injectable()
export class ConfirmCollectionUseCase implements IUseCase<ConfirmCollectionDto, Package> {
  constructor(
    @Inject(DOMAIN_TOKENS.PACKAGE_REPOSITORY)
    private readonly packageRepository: IPackageRepository,
    @Inject(DOMAIN_TOKENS.SYSTEM_PARAMETER_REPOSITORY)
    private readonly systemParameterRepository: ISystemParameterRepository,
    @Inject(DOMAIN_TOKENS.ROUTE_REPOSITORY)
    private readonly routeRepository: IRouteRepository,
  ) { }

  async call(param: ConfirmCollectionDto): Promise<Package> {
    const pkg = await this.packageRepository.findByCollectionConfirmationToken(
      param.token,
    );
    if (!pkg) {
      throw new NotFoundException('Token de confirmação inválido');
    }

    if (pkg.route?.startDate) {
      const days = await this.getDeadlineDays();
      if (this.isPastDeadline(pkg.route.startDate, days)) {
        throw new BadRequestException(
          'O prazo para confirmar a recolha já expirou',
        );
      }
    }

    const [updated] = await this.packageRepository.update(
      { id: pkg.id },
      {
        status: PackageStatus.CONFIRMED,
        collectionConfirmedAt: new Date(),
        collectionConfirmationToken: null,
      },
    );

    // Se, com esta confirmação, todas as solicitações da rota ficaram
    // confirmadas, a rota avança para o próximo estado.
    await this.advanceRouteIfAllConfirmed(pkg.route?.id);

    return updated;
  }

  /**
   * Avança a rota de CREATED para WAITING_TO_START quando todas as suas
   * solicitações têm a recolha confirmada pelo cliente. Só atua em rotas CREATED
   * (as demais já avançaram ou ainda não foram confirmadas).
   */
  private async advanceRouteIfAllConfirmed(routeId?: string): Promise<void> {
    if (!routeId) return;

    const route = await this.routeRepository.findOneWithAllRelations(routeId);
    if (!route || route.status !== RouteStatus.CREATED) return;

    const packages = route.packages ?? [];
    if (packages.length === 0) return;

    const allConfirmed = packages.every(
      (pkg) => pkg.collectionConfirmedAt != null,
    );
    if (!allConfirmed) return;

    await this.routeRepository.update(
      { id: route.id },
      { status: RouteStatus.WAITING_TO_START },
    );
  }

  private async getDeadlineDays(): Promise<number> {
    const params = await this.systemParameterRepository.getSingleton();
    return (
      params?.collectionConfirmationDeadlineDays ??
      DEFAULT_CONFIRMATION_DEADLINE_DAYS
    );
  }

  // Verdadeiro se hoje já passou do dia-limite (startDate - days).
  private isPastDeadline(startDate: Date, days: number): boolean {
    const start = new Date(startDate);
    const deadline = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate() - days,
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.getTime() > deadline.getTime();
  }
}
