import { Body, Controller, Delete, Get, Param, Post, Put, Query } from "@nestjs/common";
import { ProcessCollectionSchedulesUseCase } from "../../app/use-cases/collection/process-collection-schedules-use-case";
import { SendCollectionRemindersUseCase } from "../../app/use-cases/collection/send-collection-reminders-use-case";
import { CreateRouteUseCase } from "../../app/use-cases/route/create-route-use-case";
import { CreateRouteDto } from "../../app/use-cases/route/create-route-use-case/create-route.dto";
import { DeleteRouteUseCase } from "../../app/use-cases/route/delete-route-use-case";
import { GetAllRoutesUseCase } from "../../app/use-cases/route/get-all-routes-use-case";
import { GetAllRoutesDto } from "../../app/use-cases/route/get-all-routes-use-case/get-all-routes.dto";
import { GetRouteByIdUseCase } from "../../app/use-cases/route/get-route-by-id-use-case";
import { GetRouteBagsUseCase } from "../../app/use-cases/collection-request-bag/get-route-bags-use-case";
import { GetRouteCollectionRequestBagsUseCase } from "../../app/use-cases/route/get-route-collection-request-bags-use-case";
import { SendRouteSurveyUseCase } from "../../app/use-cases/route/send-route-survey-use-case";
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
    private readonly getRouteBagsUseCase: GetRouteBagsUseCase,
    private readonly getRouteCollectionRequestBagsUseCase: GetRouteCollectionRequestBagsUseCase,
    private readonly sendRouteSurveyUseCase: SendRouteSurveyUseCase,
    private readonly sendCollectionRemindersUseCase: SendCollectionRemindersUseCase,
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

  // Disparo manual (ADMIN) dos lembretes da véspera — o mesmo que o cron das
  // 09:00. Só envia a quem ainda não recebeu, portanto é seguro repetir.
  @Post('send-collection-reminders')
  @Roles(Role.ADMIN)
  sendCollectionReminders() {
    return this.sendCollectionRemindersUseCase.call();
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
  @Get(':id/bags')
  getRouteBags(@Param('id') id: string) {
    return this.getRouteBagsUseCase.call(id);
  }

  // Pacotes da recolha com os volumes (QR codes) de cada um (modal de detalhe).
  @Get(':id/collection-request-bags')
  getRouteCollectionRequestBags(@Param('id') id: string) {
    return this.getRouteCollectionRequestBagsUseCase.call(id);
  }

  // Disparo manual do questionário de satisfação aos clientes da recolha.
  // Só permitido quando a recolha está finalizada (FINISHED).
  @Post(':id/send-survey')
  @Roles(Role.ADMIN, Role.OPS)
  sendSurvey(@Param('id') id: string) {
    return this.sendRouteSurveyUseCase.call(id);
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