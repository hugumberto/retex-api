import { Body, Controller, Delete, Get, Param, Post, Put, Query } from "@nestjs/common";
import { ProcessCollectionSchedulesUseCase } from "../../app/use-cases/collection/process-collection-schedules-use-case";
import { CreateRouteUseCase } from "../../app/use-cases/route/create-route-use-case";
import { CreateRouteDto } from "../../app/use-cases/route/create-route-use-case/create-route.dto";
import { DeleteRouteUseCase } from "../../app/use-cases/route/delete-route-use-case";
import { GetAllRoutesUseCase } from "../../app/use-cases/route/get-all-routes-use-case";
import { GetAllRoutesDto } from "../../app/use-cases/route/get-all-routes-use-case/get-all-routes.dto";
import { GetRouteByIdUseCase } from "../../app/use-cases/route/get-route-by-id-use-case";
import { GetRouteQrCodesUseCase } from "../../app/use-cases/qr-code/get-route-qr-codes-use-case";
import { UpdateRouteUseCase } from "../../app/use-cases/route/update-route-use-case";
import { UpdateRouteDto } from "../../app/use-cases/route/update-route-use-case/update-route.dto";
import { Role } from "../../domain/user/user-roles.entity";
import { Roles } from "../auth/decorators/roles.decorator";

@Controller('route')
@Roles(Role.ADMIN, Role.OPS, Role.DRIVER)
export class RouteController {
  constructor(
    private readonly createRouteUseCase: CreateRouteUseCase,
    private readonly deleteRouteUseCase: DeleteRouteUseCase,
    private readonly getAllRoutesUseCase: GetAllRoutesUseCase,
    private readonly getRouteByIdUseCase: GetRouteByIdUseCase,
    private readonly updateRouteUseCase: UpdateRouteUseCase,
    private readonly processCollectionSchedulesUseCase: ProcessCollectionSchedulesUseCase,
    private readonly getRouteQrCodesUseCase: GetRouteQrCodesUseCase,
  ) { }

  @Post()
  createRoute(@Body() body: CreateRouteDto) {
    return this.createRouteUseCase.call(body);
  }

  // Disparo manual (ADMIN) do processamento da agenda de coleta — mesmo que o
  // cron diário faz: remove não-confirmados vencidos e move confirmados no dia.
  @Post('process-schedules')
  @Roles(Role.ADMIN)
  processSchedules() {
    return this.processCollectionSchedulesUseCase.call();
  }

  @Get()
  getAllRoutes(@Query() query: GetAllRoutesDto) {
    return this.getAllRoutesUseCase.call(query);
  }

  @Get(':id')
  getRouteById(@Param('id') id: string) {
    return this.getRouteByIdUseCase.call(id);
  }

  // QR codes gerados para a rota (para impressão).
  @Get(':id/qr-codes')
  getRouteQrCodes(@Param('id') id: string) {
    return this.getRouteQrCodesUseCase.call(id);
  }

  @Put(':id')
  updateRoute(@Param('id') id: string, @Body() body: UpdateRouteDto) {
    return this.updateRouteUseCase.call({ id, data: body });
  }

  @Delete(':id')
  deleteRoute(@Param('id') id: string) {
    return this.deleteRouteUseCase.call(id);
  }
} 