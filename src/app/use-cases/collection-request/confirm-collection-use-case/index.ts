import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CollectionRequest, CollectionRequestStatus } from '../../../../domain/collection-request/collection-request.entity';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { IRouteRepository } from '../../../../domain/route/route.repository';
import { ISystemParameterRepository } from '../../../../domain/system-parameter/system-parameter.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { advanceRouteIfAllConfirmed } from '../../shared/advance-route.util';
import { ConfirmCollectionDto } from './confirm-collection.dto';

export { ConfirmCollectionDto };

const DEFAULT_CONFIRMATION_DEADLINE_DAYS = 2;

@Injectable()
export class ConfirmCollectionUseCase implements IUseCase<ConfirmCollectionDto, CollectionRequest> {
  constructor(
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY)
    private readonly collectionRequestRepository: ICollectionRequestRepository,
    @Inject(DOMAIN_TOKENS.SYSTEM_PARAMETER_REPOSITORY)
    private readonly systemParameterRepository: ISystemParameterRepository,
    @Inject(DOMAIN_TOKENS.ROUTE_REPOSITORY)
    private readonly routeRepository: IRouteRepository,
  ) { }

  async call(param: ConfirmCollectionDto): Promise<CollectionRequest> {
    const pkg = await this.collectionRequestRepository.findByCollectionConfirmationToken(
      param.token,
    );
    if (!pkg) {
      throw new NotFoundException('errors.auth.confirmationTokenInvalid');
    }

    if (pkg.route?.startDate) {
      const days = await this.getDeadlineDays();
      if (this.isPastDeadline(pkg.route.startDate, days)) {
        throw new BadRequestException('errors.collection.confirmationDeadlineExpired',
        );
      }
    }

    const [updated] = await this.collectionRequestRepository.update(
      { id: pkg.id },
      {
        status: CollectionRequestStatus.CONFIRMED,
        collectionConfirmedAt: new Date(),
        collectionConfirmationToken: null,
      },
    );

    // Se, com esta confirmação, todas as solicitações da rota ficaram
    // confirmadas, a rota avança para o próximo estado.
    await this.advanceRouteIfAllConfirmed(pkg.route?.id);

    return updated;
  }

  private advanceRouteIfAllConfirmed(routeId?: string): Promise<void> {
    return advanceRouteIfAllConfirmed(this.routeRepository, routeId);
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
