import { Inject, Injectable } from '@nestjs/common';
import { ITriageStationRepository, TriageExportRow } from '../../../../domain/triage-station/triage-station.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { startOfTodayInLisbon } from '../get-triage-queue-use-case';

/** Meia-noite (Lisboa) do dia `YYYY-MM-DD`. */
export const startOfDayInLisbon = (date: string): Date => startOfTodayInLisbon(new Date(`${date}T12:00:00Z`));

/** Peças registadas num dia, para o "Exportar dia (CSV)". */
@Injectable()
export class GetTriageExportUseCase implements IUseCase<{ date: string }, TriageExportRow[]> {
  constructor(
    @Inject(DOMAIN_TOKENS.TRIAGE_STATION_REPOSITORY)
    private readonly stationRepository: ITriageStationRepository,
  ) {}

  async call({ date }: { date: string }): Promise<TriageExportRow[]> {
    const since = startOfDayInLisbon(date);
    const next = new Date(`${date}T12:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    return this.stationRepository.exportRows(since, startOfTodayInLisbon(next));
  }
}
