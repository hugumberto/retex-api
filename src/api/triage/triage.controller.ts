import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { GetCollectionRequestDetailUseCase } from '../../app/use-cases/collection-request/get-collection-request-detail-use-case';
import { GetTriageQueueUseCase } from '../../app/use-cases/triage/get-triage-queue-use-case';
import { ProcessTriageQrUseCase } from '../../app/use-cases/triage/process-triage-qr-use-case';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ProcessTriageQrDto } from '../../app/use-cases/triage/process-triage-qr-use-case/process-triage-qr.dto';
import { Role } from '../../domain/user/user-roles.entity';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('triage')
@Roles(Role.ADMIN, Role.OPS)
export class TriageController {
  constructor(
    private readonly getCollectionRequestDetailUseCase: GetCollectionRequestDetailUseCase,
    private readonly processTriageQrUseCase: ProcessTriageQrUseCase,
    private readonly getTriageQueueUseCase: GetTriageQueueUseCase,
  ) {}

  // Fila do posto: pedidos prontos a triar, peças de hoje do operador e as
  // categorias dos atalhos. Antes de `:code`, para não ser lida como código.
  @Get('queue')
  queue(@CurrentUser('sub') operatorId: string) {
    return this.getTriageQueueUseCase.call({ operatorId });
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
