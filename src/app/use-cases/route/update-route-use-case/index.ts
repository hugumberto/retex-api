import { BadRequestException, ConflictException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PackageStatus } from '../../../../domain/package/package.entity';
import { IPackageRepository } from '../../../../domain/package/package.repository';
import { IQrCodeRepository } from '../../../../domain/qr-code/qr-code.repository';
import { Route, RouteStatus } from '../../../../domain/route/route.entity';
import { IRouteRepository } from '../../../../domain/route/route.repository';
import { ISystemParameterRepository } from '../../../../domain/system-parameter/system-parameter.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { Role } from '../../../../domain/user/user-roles.entity';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { IUseCase } from '../../interfaces/use-case.interface';
import { SendCollectionConfirmationUseCase } from '../../package/send-collection-confirmation-use-case';
import { GenerateCollectionQrCodesUseCase } from '../../qr-code/generate-collection-qr-codes-use-case';
import { UpdateRouteDto } from './update-route.dto';

const DEFAULT_QR_CODE_THRESHOLD_PERCENTAGE = 10;

export interface UpdateRouteParamDto {
  id: string;
  data: UpdateRouteDto;
}

@Injectable()
export class UpdateRouteUseCase implements IUseCase<UpdateRouteParamDto, Route> {
  private readonly logger = new Logger(UpdateRouteUseCase.name);

  constructor(
    @Inject(DOMAIN_TOKENS.ROUTE_REPOSITORY)
    private readonly routeRepository: IRouteRepository,
    @Inject(DOMAIN_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(DOMAIN_TOKENS.PACKAGE_REPOSITORY)
    private readonly packageRepository: IPackageRepository,
    @Inject(DOMAIN_TOKENS.QR_CODE_REPOSITORY)
    private readonly qrCodeRepository: IQrCodeRepository,
    @Inject(DOMAIN_TOKENS.SYSTEM_PARAMETER_REPOSITORY)
    private readonly systemParameterRepository: ISystemParameterRepository,
    private readonly sendCollectionConfirmationUseCase: SendCollectionConfirmationUseCase,
    private readonly generateCollectionQrCodesUseCase: GenerateCollectionQrCodesUseCase,
  ) { }

  async call(param: UpdateRouteParamDto): Promise<Route> {
    const { id, data } = param;

    // 1. Verificar se a route existe (com packages, para reverter os removidos)
    const existingRoute = await this.routeRepository.findOneWithAllRelations(id);
    if (!existingRoute) {
      throw new NotFoundException('Route não encontrada');
    }

    // 2. Rota já confirmada trava a composição — só o status/endDate avançam.
    if (existingRoute.status !== RouteStatus.DRAFTING) {
      if (
        data.driverId ||
        data.packageIds ||
        data.startDate ||
        data.collectionInterval
      ) {
        throw new BadRequestException(
          'A rota já foi confirmada e não permite alterar motorista, solicitações, data ou intervalo',
        );
      }
    }

    // 3. Preparar dados para atualização
    const updateData: Partial<Route> = {};

    // 3. Validar e atualizar driver se fornecido
    if (data.driverId) {
      const driver = await this.userRepository.findOneWithRelations({ id: data.driverId });
      if (!driver) {
        throw new NotFoundException('Driver não encontrado');
      }

      const hasDriverRole = driver.roles?.some(role => role.role === Role.DRIVER);
      if (!hasDriverRole) {
        throw new BadRequestException('Usuário não possui role de driver');
      }

      updateData.driver = driver;
    }

    // 4. Validar e atualizar packages se fornecidos
    if (data.packageIds) {
      const packages = [];
      for (const packageId of data.packageIds) {
        const packageEntity = await this.packageRepository.findOneWithAllRelations(packageId);
        if (!packageEntity) {
          throw new NotFoundException(`Package com ID ${packageId} não encontrado`);
        }

        // Apenas solicitações no status CREATED podem estar numa rota.
        if (packageEntity.status !== PackageStatus.CREATED) {
          throw new BadRequestException(
            `Package ${packageId} não está no status CREATED`,
          );
        }

        // Uma solicitação existe em no máximo uma rota (exceto a atual).
        if (packageEntity.route && packageEntity.route.id !== id) {
          throw new ConflictException(`Package ${packageId} já está associado a outra rota`);
        }

        packages.push(packageEntity);
      }
      updateData.packages = packages;
    }

    // 5. Atualizar outros campos
    if (data.status) {
      updateData.status = data.status;
    }

    if (data.collectionInterval) {
      updateData.collectionInterval = data.collectionInterval;
    }

    if (data.startDate) {
      updateData.startDate = new Date(data.startDate);
    }

    if (data.endDate) {
      updateData.endDate = new Date(data.endDate);
    }

    // 6. Atualizar a route
    const [updatedRoute] = await this.routeRepository.update({ id }, updateData);

    // 7. Solicitações removidas da rota → voltam a CREATED (só em DRAFTING).
    if (data.packageIds) {
      const newIds = new Set(data.packageIds);
      for (const previous of existingRoute.packages ?? []) {
        if (!newIds.has(previous.id)) {
          await this.packageRepository.update(
            { id: previous.id },
            {
              route: null,
              status: PackageStatus.CREATED,
              collectionConfirmationToken: null,
              collectionConfirmedAt: null,
            },
          );
        }
      }
    }

    // 8. Transição DRAFTING→CREATED: enviar a confirmação a todas as
    // solicitações da rota (fire-and-forget). Restrito a DRAFTING para não
    // reenviar emails caso o status regrida para CREATED.
    if (
      existingRoute.status === RouteStatus.DRAFTING &&
      data.status === RouteStatus.CREATED
    ) {
      const packageIds =
        data.packageIds ?? (existingRoute.packages ?? []).map((pkg) => pkg.id);
      for (const packageId of packageIds) {
        this.sendCollectionConfirmationUseCase
          .call(packageId)
          .catch((err) =>
            this.logger.error(
              `Falha ao enviar confirmação de coleta do package ${packageId}: ${err.message}`,
            ),
          );
      }
    }

    // 9. Transição → IN_TRANSIT: as solicitações confirmadas vão para
    // WAITING_FOR_COLLECTION e são gerados os QR codes (volumes + threshold%).
    if (
      existingRoute.status !== RouteStatus.IN_TRANSIT &&
      data.status === RouteStatus.IN_TRANSIT
    ) {
      const params = await this.systemParameterRepository.getSingleton();
      const threshold =
        params?.qrCodeThresholdPercentage ??
        DEFAULT_QR_CODE_THRESHOLD_PERCENTAGE;

      for (const pkg of existingRoute.packages ?? []) {
        // Confirmadas (inclui as já movidas a WAITING_FOR_COLLECTION pelo cron).
        if (pkg.collectionConfirmedAt == null) {
          continue;
        }
        // Nunca gerar menos de 1 QR code por solicitação confirmada.
        const quantity = Math.max(
          1,
          Math.ceil((pkg.estimatedVolumes ?? 0) * (1 + threshold / 100)),
        );
        await this.packageRepository.update(
          { id: pkg.id },
          {
            status: PackageStatus.WAITING_FOR_COLLECTION,
            qrCodesGenerated: quantity,
          },
        );
        await this.generateCollectionQrCodesUseCase.call({
          routeId: id,
          quantity,
        });
      }
    }

    // 10. Transição → FINISHED: apaga os QR codes da rota não utilizados.
    if (
      existingRoute.status !== RouteStatus.FINISHED &&
      data.status === RouteStatus.FINISHED
    ) {
      await this.qrCodeRepository.deleteUnusedByRoute(id);
    }

    return updatedRoute;
  }
}