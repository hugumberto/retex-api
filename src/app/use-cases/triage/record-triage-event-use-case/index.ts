import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { Inject, Injectable } from '@nestjs/common';
import { TriageEventType } from '../../../../domain/triage-station/triage-station.entity';
import { ITriageStationRepository } from '../../../../domain/triage-station/triage-station.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

export class RecordTriageEventDto {
  @IsEnum(TriageEventType)
  type: TriageEventType;

  @IsString()
  @MaxLength(100)
  code: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  requestCode?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  otherRequestCode?: string | null;
}

export type RecordTriageEventParams = RecordTriageEventDto & { station: number; operatorId: string };

/** Ocorrência de um posto (por agora, saco de outro pedido) para os alertas. */
@Injectable()
export class RecordTriageEventUseCase implements IUseCase<RecordTriageEventParams, void> {
  constructor(
    @Inject(DOMAIN_TOKENS.TRIAGE_STATION_REPOSITORY)
    private readonly stationRepository: ITriageStationRepository,
  ) {}

  async call(param: RecordTriageEventParams): Promise<void> {
    await this.stationRepository.recordEvent({
      station: param.station,
      type: param.type,
      operatorId: param.operatorId,
      code: param.code.trim().toUpperCase(),
      requestCode: param.requestCode ?? null,
      otherRequestCode: param.otherRequestCode ?? null,
    });
  }
}
