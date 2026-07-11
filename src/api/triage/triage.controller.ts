import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { GetTriagePackageUseCase } from '../../app/use-cases/triage/get-triage-package-use-case';
import { ProcessTriageQrUseCase } from '../../app/use-cases/triage/process-triage-qr-use-case';
import { ProcessTriageQrDto } from '../../app/use-cases/triage/process-triage-qr-use-case/process-triage-qr.dto';
import { Role } from '../../domain/user/user-roles.entity';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('triage')
@Roles(Role.ADMIN, Role.OPS)
export class TriageController {
  constructor(
    private readonly getTriagePackageUseCase: GetTriagePackageUseCase,
    private readonly processTriageQrUseCase: ProcessTriageQrUseCase,
  ) {}

  // Consulta por código da solicitação OU de um QR (token/código amigável).
  @Get(':code')
  getByCode(@Param('code') code: string) {
    return this.getTriagePackageUseCase.call(code);
  }

  // Processa um volume (peso + marca como processado).
  @Post('qr/:qrCodeId/process')
  processQr(
    @Param('qrCodeId') qrCodeId: string,
    @Body() dto: ProcessTriageQrDto,
  ) {
    return this.processTriageQrUseCase.call({ qrCodeId, weight: dto.weight });
  }
}
