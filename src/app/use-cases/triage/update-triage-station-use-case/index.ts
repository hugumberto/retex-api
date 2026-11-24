import { Inject, Injectable } from '@nestjs/common';
import {
  STATION_STALE_MINUTES,
  TriageStation,
  TriageStationStatus,
} from '../../../../domain/triage-station/triage-station.entity';
import { ITriageStationRepository } from '../../../../domain/triage-station/triage-station.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { UpdateTriageStationDto } from './update-triage-station.dto';

export type UpdateTriageStationParams = UpdateTriageStationDto & {
  number: number;
  operatorId: string;
};

/**
 * O posto em ecrã inteiro chama isto ao escolher o posto, ao abrir e fechar
 * pedidos, ao pausar e a cada minuto. Um operador só está num posto; quem
 * ocupa um posto tira o anterior. Abrir o pedido atribuído limpa a atribuição.
 */
@Injectable()
export class UpdateTriageStationUseCase
  implements IUseCase<UpdateTriageStationParams, TriageStation>
{
  constructor(
    @Inject(DOMAIN_TOKENS.TRIAGE_STATION_REPOSITORY)
    private readonly stationRepository: ITriageStationRepository,
  ) {}

  async call(param: UpdateTriageStationParams, now = new Date()): Promise<TriageStation> {
    const existing = await this.stationRepository.findByNumber(param.number);

    if (param.release) {
      // Só liberta se ainda for deste operador (outro pode já ter ocupado o posto).
      if (!existing || existing.operatorId !== param.operatorId) return existing;
      const [released] = await this.stationRepository.update(
        { id: existing.id },
        {
          operatorId: null,
          collectionRequestId: null,
          status: TriageStationStatus.FREE,
          sessionStartedAt: null,
          pendingLots: null,
          lastSeenAt: now,
        },
      );
      return released;
    }

    await this.stationRepository.releaseOperator(param.operatorId, param.number);

    const requestId = param.status === TriageStationStatus.FREE ? null : (param.collectionRequestId ?? null);
    if (requestId) await this.stationRepository.clearAssignment(requestId, param.number);

    const stale =
      !existing?.lastSeenAt ||
      now.getTime() - new Date(existing.lastSeenAt).getTime() > STATION_STALE_MINUTES * 60_000;
    const newSession = !existing || existing.operatorId !== param.operatorId || stale;

    const data: Partial<TriageStation> = {
      operatorId: param.operatorId,
      status: param.status,
      collectionRequestId: requestId,
      pendingLots: requestId && param.pendingLots?.length ? param.pendingLots : null,
      lastSeenAt: now,
      sessionStartedAt: newSession ? now : existing.sessionStartedAt,
      ...(requestId && existing?.assignedRequestId === requestId ? { assignedRequestId: null } : {}),
    };

    if (!existing) {
      return this.stationRepository.create({ number: param.number, ...data });
    }
    const [updated] = await this.stationRepository.update({ id: existing.id }, data);
    return updated;
  }
}
