import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { IsOptional, IsUUID } from 'class-validator';
import { AssignTriageStationUseCase } from '../../app/use-cases/triage/assign-triage-station-use-case';
import { GetTriageExportUseCase } from '../../app/use-cases/triage/get-triage-export-use-case';
import { GetTriageOverviewUseCase } from '../../app/use-cases/triage/get-triage-overview-use-case';
import {
  RecordTriageEventDto,
  RecordTriageEventUseCase,
} from '../../app/use-cases/triage/record-triage-event-use-case';
import { UpdateTriageStationUseCase } from '../../app/use-cases/triage/update-triage-station-use-case';
import { UpdateTriageStationDto } from '../../app/use-cases/triage/update-triage-station-use-case/update-triage-station.dto';
import { GetCollectionRequestDetailUseCase } from '../../app/use-cases/collection-request/get-collection-request-detail-use-case';
import { GetTriageQueueUseCase } from '../../app/use-cases/triage/get-triage-queue-use-case';
import { ProcessTriageQrUseCase } from '../../app/use-cases/triage/process-triage-qr-use-case';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ProcessTriageQrDto } from '../../app/use-cases/triage/process-triage-qr-use-case/process-triage-qr.dto';
import { Role } from '../../domain/user/user-roles.entity';
import { Roles } from '../auth/decorators/roles.decorator';

class AssignTriageStationDto {
  @IsOptional()
  @IsUUID()
  collectionRequestId?: string | null;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

const stationNumber = (n: number): number => {
  if (n < 1 || n > 99) throw new BadRequestException('errors.triage.invalidStation');
  return n;
};

@Controller('triage')
@Roles(Role.ADMIN, Role.OPS)
export class TriageController {
  constructor(
    private readonly getCollectionRequestDetailUseCase: GetCollectionRequestDetailUseCase,
    private readonly processTriageQrUseCase: ProcessTriageQrUseCase,
    private readonly getTriageQueueUseCase: GetTriageQueueUseCase,
    private readonly getTriageOverviewUseCase: GetTriageOverviewUseCase,
    private readonly getTriageExportUseCase: GetTriageExportUseCase,
    private readonly updateTriageStationUseCase: UpdateTriageStationUseCase,
    private readonly assignTriageStationUseCase: AssignTriageStationUseCase,
    private readonly recordTriageEventUseCase: RecordTriageEventUseCase,
  ) {}

  // Fila do posto: pedidos prontos a triar, peças de hoje do operador e as
  // categorias dos atalhos. Antes de `:code`, para não ser lida como código.
  @Get('queue')
  queue(@CurrentUser('sub') operatorId: string, @Query('station') station?: string) {
    const n = Number(station);
    return this.getTriageQueueUseCase.call({ operatorId, station: Number.isInteger(n) && n > 0 ? n : undefined });
  }

  // Painel de supervisão (postos, fila, destino das peças de hoje, alertas).
  @Get('overview')
  @Roles(Role.ADMIN)
  overview() {
    return this.getTriageOverviewUseCase.call();
  }

  // Peças registadas num dia (YYYY-MM-DD, por omissão hoje) para o CSV.
  @Get('export')
  @Roles(Role.ADMIN)
  export(@Query('date') date?: string) {
    const day =
      date && DATE.test(date)
        ? date
        : new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Lisbon' }).format(new Date());
    return this.getTriageExportUseCase.call({ date: day });
  }

  // Sinal do posto em ecrã inteiro: quem lá está, pedido aberto, pausa.
  @Put('station/:number')
  updateStation(
    @Param('number', ParseIntPipe) number: number,
    @Body() dto: UpdateTriageStationDto,
    @CurrentUser('sub') operatorId: string,
  ) {
    return this.updateTriageStationUseCase.call({ ...dto, number: stationNumber(number), operatorId });
  }

  // A supervisão atribui (ou tira) um pedido a um posto.
  @Post('station/:number/assign')
  @Roles(Role.ADMIN)
  assignStation(@Param('number', ParseIntPipe) number: number, @Body() dto: AssignTriageStationDto) {
    return this.assignTriageStationUseCase.call({
      number: stationNumber(number),
      collectionRequestId: dto.collectionRequestId ?? null,
    });
  }

  // Ocorrência do posto (saco de outro pedido) para os alertas.
  @Post('station/:number/event')
  recordEvent(
    @Param('number', ParseIntPipe) number: number,
    @Body() dto: RecordTriageEventDto,
    @CurrentUser('sub') operatorId: string,
  ) {
    return this.recordTriageEventUseCase.call({ ...dto, station: stationNumber(number), operatorId });
  }

  // Consulta por código da solicitação OU de um QR (token/código amigável).
  @Get(':code')
  getByCode(@Param('code') code: string) {
    return this.getCollectionRequestDetailUseCase.call(code);
  }

  // Processa um volume (peso + marca como processado).
  @Post('bag/:bagId/process')
  processQr(
    @Param('bagId') bagId: string,
    @Body() dto: ProcessTriageQrDto,
  ) {
    return this.processTriageQrUseCase.call({ bagId, weight: dto.weight });
  }

  // Grava só o peso do volume (guardar progresso), sem o marcar como processado.
  @Patch('bag/:bagId/weight')
  saveBagWeight(
    @Param('bagId') bagId: string,
    @Body() dto: ProcessTriageQrDto,
  ) {
    return this.processTriageQrUseCase.call({
      bagId,
      weight: dto.weight,
      markProcessed: false,
    });
  }
}
