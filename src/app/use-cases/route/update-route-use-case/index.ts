import { BadRequestException, ConflictException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CollectionRequestStatus } from '../../../../domain/collection-request/collection-request.entity';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { ICollectionRequestBagRepository } from '../../../../domain/collection-request-bag/collection-request-bag.repository';
import { Route, RouteStatus } from '../../../../domain/route/route.entity';
import { IRouteRepository } from '../../../../domain/route/route.repository';
import { ISystemParameterRepository } from '../../../../domain/system-parameter/system-parameter.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { Role } from '../../../../domain/user/user-roles.entity';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { IUseCase } from '../../interfaces/use-case.interface';
import { SendCollectionConfirmationUseCase } from '../../collection-request/send-collection-confirmation-use-case';
import { GenerateCollectionBagsUseCase } from '../../collection-request-bag/generate-collection-bags-use-case';
import { SendRouteSurveyUseCase } from '../send-route-survey-use-case';
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
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY)
    private readonly collectionRequestRepository: ICollectionRequestRepository,
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_BAG_REPOSITORY)
    private readonly collectionRequestBagRepository: ICollectionRequestBagRepository,
    @Inject(DOMAIN_TOKENS.SYSTEM_PARAMETER_REPOSITORY)
    private readonly systemParameterRepository: ISystemParameterRepository,
    private readonly sendCollectionConfirmationUseCase: SendCollectionConfirmationUseCase,
    private readonly generateCollectionBagsUseCase: GenerateCollectionBagsUseCase,
    private readonly sendRouteSurveyUseCase: SendRouteSurveyUseCase,
  ) { }

  async call(param: UpdateRouteParamDto): Promise<Route> {
    const { id, data } = param;

    // 1. Verificar se a route existe (com collectionRequests, para reverter os removidos)
    const existingRoute = await this.routeRepository.findOneWithAllRelations(id);
    if (!existingRoute) {
      throw new NotFoundException('errors.route.notFound');
    }

    // 2. Rota já confirmada trava a composição — só o status/endDate avançam.
    if (existingRoute.status !== RouteStatus.DRAFTING) {
      if (
        data.driverId ||
        data.collectionRequestIds ||
        data.startDate ||
        data.collectionInterval
      ) {
        throw new BadRequestException('errors.route.alreadyConfirmed',
        );
      }
    }

    // 3. Preparar dados para atualização
    const updateData: Partial<Route> = {};

    // 3. Validar e atualizar driver se fornecido
    if (data.driverId) {
      const driver = await this.userRepository.findOneWithRelations({ id: data.driverId });
      if (!driver) {
        throw new NotFoundException('errors.user.driverNotFound');
      }

      const hasDriverRole = driver.roles?.some(role => role.role === Role.DRIVER);
      if (!hasDriverRole) {
        throw new BadRequestException('errors.user.notDriver');
      }

      updateData.driver = driver;
    }

    // 4. Validar e atualizar collectionRequests se fornecidos
    if (data.collectionRequestIds) {
      const collectionRequests = [];
      for (const collectionRequestId of data.collectionRequestIds) {
        const collectionRequestEntity = await this.collectionRequestRepository.findOneWithAllRelations(collectionRequestId);
        if (!collectionRequestEntity) {
          throw new NotFoundException({ key: 'errors.collectionRequest.notFoundWithId', args: { id: collectionRequestId } });
        }

        // Apenas solicitações no status CREATED podem estar numa rota.
        if (collectionRequestEntity.status !== CollectionRequestStatus.CREATED) {
          throw new BadRequestException(
            `CollectionRequest ${collectionRequestId} não está no status CREATED`,
          );
        }

        // Uma solicitação existe em no máximo uma rota (exceto a atual).
        if (collectionRequestEntity.route && collectionRequestEntity.route.id !== id) {
          throw new ConflictException({ key: 'errors.collectionRequest.alreadyLinkedToAnotherRoute', args: { id: collectionRequestId } });
        }

        collectionRequests.push(collectionRequestEntity);
      }
      updateData.collectionRequests = collectionRequests;
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
    if (data.collectionRequestIds) {
      const newIds = new Set(data.collectionRequestIds);
      for (const previous of existingRoute.collectionRequests ?? []) {
        if (!newIds.has(previous.id)) {
          await this.collectionRequestRepository.update(
            { id: previous.id },
            {
              route: null,
              status: CollectionRequestStatus.CREATED,
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
      const collectionRequestIds =
        data.collectionRequestIds ?? (existingRoute.collectionRequests ?? []).map((pkg) => pkg.id);
      for (const collectionRequestId of collectionRequestIds) {
        this.sendCollectionConfirmationUseCase
          .call(collectionRequestId)
          .catch((err) =>
            this.logger.error(
              `Falha ao enviar confirmação de coleta do package ${collectionRequestId}: ${err.message}`,
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

      for (const pkg of existingRoute.collectionRequests ?? []) {
        // Confirmadas (inclui as já movidas a WAITING_FOR_COLLECTION pelo cron).
        if (pkg.collectionConfirmedAt == null) {
          continue;
        }
        // Nunca gerar menos de 1 QR code por solicitação confirmada.
        const quantity = Math.max(
          1,
          Math.ceil((pkg.estimatedBags ?? 0) * (1 + threshold / 100)),
        );
        await this.collectionRequestRepository.update(
          { id: pkg.id },
          {
            status: CollectionRequestStatus.WAITING_FOR_COLLECTION,
            bagsGenerated: quantity,
          },
        );
        await this.generateCollectionBagsUseCase.call({
          routeId: id,
          quantity,
        });
      }
    }

    // 10. Transição → FINISHED: apaga os QR codes da rota não utilizados e
    // envia o questionário de satisfação aos clientes (fire-and-forget).
    if (
      existingRoute.status !== RouteStatus.FINISHED &&
      data.status === RouteStatus.FINISHED
    ) {
      await this.collectionRequestBagRepository.deleteUnusedByRoute(id);
      this.sendRouteSurveyUseCase.sendForRoute(existingRoute).catch((err) =>
        this.logger.error(
          `Falha ao enviar questionário da rota ${id}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        ),
      );
    }

    return updatedRoute;
  }
}