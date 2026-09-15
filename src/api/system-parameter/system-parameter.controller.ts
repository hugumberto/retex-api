import { Body, Controller, Get, Put } from '@nestjs/common';
import {
  GetSystemParametersUseCase,
  UpdateSystemParametersDto,
  UpdateSystemParametersUseCase,
} from '../../app/use-cases/system-parameter';
import { Role } from '../../domain/user/user-roles.entity';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('system-parameter')
@Roles(Role.ADMIN)
export class SystemParameterController {
  constructor(
    private readonly getSystemParametersUseCase: GetSystemParametersUseCase,
    private readonly updateSystemParametersUseCase: UpdateSystemParametersUseCase,
  ) { }

  // A impressão de etiquetas vive em /portal/package-collection, aberto a OPS e
  // DRIVER. Sem isto, só um ADMIN conseguia imprimir com as medidas certas — os
  // outros levavam 403 e caíam nos valores por omissão sem perceber porquê.
  // Escrever continua a ser exclusivo do ADMIN, pela regra da classe.
  @Get()
  @Roles(Role.ADMIN, Role.OPS, Role.DRIVER)
  async get() {
    return this.getSystemParametersUseCase.call();
  }

  @Put()
  async update(@Body() dto: UpdateSystemParametersDto) {
    return this.updateSystemParametersUseCase.call(dto);
  }
}
