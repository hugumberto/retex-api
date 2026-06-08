import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import {
  CreateDeviceSessionDto,
  CreateDeviceSessionUseCase,
  GetDeviceSessionByUserUseCase,
} from '../../app/use-cases/device-session';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../../app/services/interfaces/auth.interface';

@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('device-session')
export class DeviceSessionController {
  constructor(
    private readonly createDeviceSessionUseCase: CreateDeviceSessionUseCase,
    private readonly getDeviceSessionByUserUseCase: GetDeviceSessionByUserUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Cria ou atualiza a sessão de dispositivo do utilizador' })
  async create(@Request() req: { user: JwtPayload }, @Body() dto: CreateDeviceSessionDto) {
    return this.createDeviceSessionUseCase.call({ ...dto, userId: req.user.sub });
  }

  @Get('me')
  @ApiOperation({ summary: 'Obtém a sessão de dispositivo ativa do utilizador autenticado' })
  async findMySession(@Request() req: { user: JwtPayload }) {
    return this.getDeviceSessionByUserUseCase.call(req.user.sub);
  }
}
