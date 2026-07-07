import { BadRequestException, ConflictException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PackageStatus } from '../../../../domain/package/package.entity';
import { IPackageRepository } from '../../../../domain/package/package.repository';
import { Route, RouteStatus } from '../../../../domain/route/route.entity';
import { IRouteRepository } from '../../../../domain/route/route.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { Role } from '../../../../domain/user/user-roles.entity';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { IUseCase } from '../../interfaces/use-case.interface';
import { SendCollectionConfirmationUseCase } from '../../package/send-collection-confirmation-use-case';
import { UpdateRouteDto } from './update-route.dto';

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
    private readonly sendCollectionConfirmationUseCase: SendCollectionConfirmationUseCase,
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
      if (data.driverId || data.packageIds || data.startDate) {
        throw new BadRequestException(
          'A rota já foi confirmada e não permite alterar motorista, solicitações ou data',
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
    // solicitações da rota (fire-and-forget).
    if (
      existingRoute.status !== RouteStatus.CREATED &&
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

    return updatedRoute;
  }
}