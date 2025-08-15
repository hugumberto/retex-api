import { Body, Controller, Get, Param, Post, Put, Query } from "@nestjs/common";
import { CreateRouteUseCase } from "../../app/use-cases/route/create-route-use-case";
import { CreateRouteDto } from "../../app/use-cases/route/create-route-use-case/create-route.dto";
import { GetAllRoutesUseCase } from "../../app/use-cases/route/get-all-routes-use-case";
import { GetAllRoutesDto } from "../../app/use-cases/route/get-all-routes-use-case/get-all-routes.dto";
import { GetRouteByIdUseCase } from "../../app/use-cases/route/get-route-by-id-use-case";
import { UpdateRouteUseCase } from "../../app/use-cases/route/update-route-use-case";
import { UpdateRouteDto } from "../../app/use-cases/route/update-route-use-case/update-route.dto";

@Controller('route')
export class RouteController {
  constructor(
    private readonly createRouteUseCase: CreateRouteUseCase,
    private readonly getAllRoutesUseCase: GetAllRoutesUseCase,
    private readonly getRouteByIdUseCase: GetRouteByIdUseCase,
    private readonly updateRouteUseCase: UpdateRouteUseCase,
  ) { }

  @Post()
  createRoute(@Body() body: CreateRouteDto) {
    return this.createRouteUseCase.call(body);
  }

  @Get()
  getAllRoutes(@Query() query: GetAllRoutesDto) {
    return this.getAllRoutesUseCase.call(query);
  }

  @Get(':id')
  getRouteById(@Param('id') id: string) {
    return this.getRouteByIdUseCase.call(id);
  }

  @Put(':id')
  updateRoute(@Param('id') id: string, @Body() body: UpdateRouteDto) {
    return this.updateRouteUseCase.call({ id, data: body });
  }
} 