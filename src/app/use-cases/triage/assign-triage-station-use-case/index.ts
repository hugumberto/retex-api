import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CollectionRequestStatus } from '../../../../domain/collection-request/collection-request.entity';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { TriageStation, TriageStationStatus } from '../../../../domain/triage-station/triage-station.entity';
import { ITriageStationRepository } from '../../../../domain/triage-station/triage-station.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

const TRIAGEABLE = [
  CollectionRequestStatus.COLLECTED,
  CollectionRequestStatus.IN_HOUSE,
  CollectionRequestStatus.SCREENING,
];

export type AssignTriageStationParams = {
  number: number;
  // Nulo tira a atribuição do posto.
  collectionRequestId: string | null;
};

/** A supervisão deixa um pedido à espera num posto (fica no topo da fila desse posto). */
@Injectable()
export class AssignTriageStationUseCase
  implements IUseCase<AssignTriageStationParams, TriageStation>
{
  constructor(
    @Inject(DOMAIN_TOKENS.TRIAGE_STATION_REPOSITORY)
    private readonly stationRepository: ITriageStationRepository,
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY)
    private readonly collectionRequestRepository: ICollectionRequestRepository,
  ) {}

  async call({ number, collectionRequestId }: AssignTriageStationParams): Promise<TriageStation> {
    if (collectionRequestId) {
      const request = await this.collectionRequestRepository.findOne({ id: collectionRequestId });
      if (!request) throw new NotFoundException('errors.triage.requestNotFound');
      if (!TRIAGEABLE.includes(request.status)) throw new BadRequestException('errors.triage.notTriageable');
      await this.stationRepository.clearAssignment(collectionRequestId, number);
    }

    const existing = await this.stationRepository.findByNumber(number);
    if (!existing) {
      return this.stationRepository.create({
        number,
        status: TriageStationStatus.FREE,
        assignedRequestId: collectionRequestId,
      });
    }
    const [updated] = await this.stationRepository.update(
      { id: existing.id },
      { assignedRequestId: collectionRequestId },
    );
    return updated;
  }
}
