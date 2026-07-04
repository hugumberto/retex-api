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

  @Get()
  async get() {
    return this.getSystemParametersUseCase.call();
  }

  @Put()
  async update(@Body() dto: UpdateSystemParametersDto) {
    return this.updateSystemParametersUseCase.call(dto);
  }
}
