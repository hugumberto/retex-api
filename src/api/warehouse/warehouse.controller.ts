import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Put, Query } from '@nestjs/common';
import { IsIn, IsOptional, Matches } from 'class-validator';
import {
  ChangeOutboundStatusUseCase,
  GetWarehouseOverviewUseCase,
  ReceiveBagDto,
  ReceiveBagUseCase,
  SaveOutboundDto,
  SaveOutboundUseCase,
} from '../../app/use-cases/warehouse';
import { Role } from '../../domain/user/user-roles.entity';
import { OutboundStatus } from '../../domain/warehouse/warehouse-outbound.entity';
import { Roles } from '../auth/decorators/roles.decorator';

class OverviewQuery {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;
}

class OutboundStatusDto {
  @IsIn([OutboundStatus.DONE, OutboundStatus.CANCELLED])
  status: OutboundStatus.DONE | OutboundStatus.CANCELLED;
}

// Dia de hoje em Portugal (o servidor corre em UTC).
const todayInLisbon = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Lisbon' }).format(new Date());

@Controller('warehouse')
@Roles(Role.ADMIN, Role.OPS)
export class WarehouseController {
  constructor(
    private readonly getWarehouseOverviewUseCase: GetWarehouseOverviewUseCase,
    private readonly receiveBagUseCase: ReceiveBagUseCase,
    private readonly saveOutboundUseCase: SaveOutboundUseCase,
    private readonly changeOutboundStatusUseCase: ChangeOutboundStatusUseCase,
  ) {}

  @Get()
  overview(@Query() query: OverviewQuery) {
    return this.getWarehouseOverviewUseCase.call({ date: query.date ?? todayInLisbon() });
  }

  @Post('reception')
  receive(@Body() dto: ReceiveBagDto) {
    return this.receiveBagUseCase.call(dto);
  }

  @Post('outbound')
  createOutbound(@Body() dto: SaveOutboundDto) {
    return this.saveOutboundUseCase.call({ data: dto });
  }

  @Put('outbound/:id')
  updateOutbound(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SaveOutboundDto) {
    return this.saveOutboundUseCase.call({ id, data: dto });
  }

  @Patch('outbound/:id/status')
  changeStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: OutboundStatusDto) {
    return this.changeOutboundStatusUseCase.call({ id, status: dto.status });
  }
}
