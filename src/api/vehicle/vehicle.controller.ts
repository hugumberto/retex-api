import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import {
  CreateVehicleDto,
  CreateVehicleUseCase,
  GetAllVehiclesUseCase,
  UpdateVehicleDto,
  UpdateVehicleUseCase,
} from '../../app/use-cases/vehicle';
import { Role } from '../../domain/user/user-roles.entity';
import { Roles } from '../auth/decorators/roles.decorator';

// Sem DELETE: um veículo usado em rotas desativa-se (`active: false`), para as
// rotas antigas continuarem a mostrar com que carrinha foram feitas.
@Controller('vehicle')
export class VehicleController {
  constructor(
    private readonly createVehicleUseCase: CreateVehicleUseCase,
    private readonly getAllVehiclesUseCase: GetAllVehiclesUseCase,
    private readonly updateVehicleUseCase: UpdateVehicleUseCase,
  ) {}

  @Get()
  @Roles(Role.ADMIN, Role.OPS)
  findAll() {
    return this.getAllVehiclesUseCase.call();
  }

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateVehicleDto) {
    return this.createVehicleUseCase.call(dto);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateVehicleDto) {
    return this.updateVehicleUseCase.call({ id, data: dto });
  }
}
