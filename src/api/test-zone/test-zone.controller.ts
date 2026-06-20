import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { CreateTestZoneDto, CreateTestZoneUseCase, DeleteTestZoneUseCase, GetAllTestZonesUseCase, NotifyZoneInactiveUsersUseCase } from '../../app/use-cases/test-zone';
import { Role } from '../../domain/user/user-roles.entity';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('zone')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class TestZoneController {
  constructor(
    private readonly createTestZoneUseCase: CreateTestZoneUseCase,
    private readonly getAllTestZonesUseCase: GetAllTestZonesUseCase,
    private readonly deleteTestZoneUseCase: DeleteTestZoneUseCase,
    private readonly notifyZoneInactiveUsersUseCase: NotifyZoneInactiveUsersUseCase,
  ) {}

  @Get()
  async findAll() {
    return this.getAllTestZonesUseCase.call();
  }

  @Post()
  async create(@Body() dto: CreateTestZoneDto) {
    return this.createTestZoneUseCase.call(dto);
  }

  @Post(':id/notify')
  async notify(@Param('id') id: string): Promise<{ notified: number }> {
    return this.notifyZoneInactiveUsersUseCase.call({ zoneId: id });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.deleteTestZoneUseCase.call({ id });
  }
}
