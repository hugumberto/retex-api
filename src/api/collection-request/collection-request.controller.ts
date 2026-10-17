import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { CollectionRequestStatus } from '../../domain/collection-request/collection-request.entity';
import { JwtPayload } from '../../app/services/interfaces/auth.interface';
import { ConfirmCollectionUseCase } from '../../app/use-cases/collection-request/confirm-collection-use-case';
import { ConfirmCollectionDto } from '../../app/use-cases/collection-request/confirm-collection-use-case/confirm-collection.dto';
import { RejectCollectionUseCase } from '../../app/use-cases/collection-request/reject-collection-use-case';
import { RejectCollectionDto } from '../../app/use-cases/collection-request/reject-collection-use-case/reject-collection.dto';
import { CreateCollectionRequestUseCase } from '../../app/use-cases/collection-request/create-collection-request-use-case';
import { CreateCollectionRequestDto } from '../../app/use-cases/collection-request/create-collection-request-use-case/create-collection-request.dto';
import { GetAllCollectionRequestsUseCase } from '../../app/use-cases/collection-request/get-all-collection-requests-use-case';
import { GetCollectionRequestsDto } from '../../app/use-cases/collection-request/get-all-collection-requests-use-case/get-collection-requests.dto';
import { GetCollectionRequestByIdUseCase } from '../../app/use-cases/collection-request/get-collection-request-by-id-use-case';
import { SetCollectionRequestRouteUseCase } from '../../app/use-cases/collection-request/set-collection-request-route-use-case';
import { SetCollectionRequestRouteDto } from '../../app/use-cases/collection-request/set-collection-request-route-use-case/set-collection-request-route.dto';
import { UpdateCollectionRequestUseCase } from '../../app/use-cases/collection-request/update-collection-request-use-case';
import { UpdateCollectionRequestDto } from '../../app/use-cases/collection-request/update-collection-request-use-case/update-collection-request.dto';
import { hasAnyRole } from '../../domain/user/role-hierarchy';
import { Role } from '../../domain/user/user-roles.entity';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

function requesterFrom(req: Request): { id: string; isPrivileged: boolean } {
  const user = req['user'] as JwtPayload;
  const isPrivileged = hasAnyRole(user?.roles, [Role.ADMIN, Role.OPS]);
  return { id: user?.sub, isPrivileged };
}

@Controller('collection-request')
export class CollectionRequestController {
  constructor(
    private readonly createCollectionRequestUseCase: CreateCollectionRequestUseCase,
    private readonly getCollectionRequestByIdUseCase: GetCollectionRequestByIdUseCase,
    private readonly updateCollectionRequestUseCase: UpdateCollectionRequestUseCase,
    private readonly getAllCollectionRequestsUseCase: GetAllCollectionRequestsUseCase,
    private readonly confirmCollectionUseCase: ConfirmCollectionUseCase,
    private readonly rejectCollectionUseCase: RejectCollectionUseCase,
    private readonly setCollectionRequestRouteUseCase: SetCollectionRequestRouteUseCase,
  ) {}

  @Post('confirm-collection')
  @Public()
  confirmCollection(@Body() body: ConfirmCollectionDto) {
    return this.confirmCollectionUseCase.call(body);
  }

  @Post('reject-collection')
  @Public()
  rejectCollection(@Body() body: RejectCollectionDto) {
    return this.rejectCollectionUseCase.call(body);
  }

  @Get()
  @Roles(Role.ADMIN, Role.OPS)
  getAll(@Query() query: GetCollectionRequestsDto) {
    return this.getAllCollectionRequestsUseCase.call(query);
  }

  @Post()
  @Roles(Role.ADMIN, Role.OPS, Role.USER)
  createCollectionRequest(
    @Req() req: Request,
    @Body() body: CreateCollectionRequestDto,
  ) {
    const { id, isPrivileged } = requesterFrom(req);
    // Um USER só pode criar solicitações para si próprio; ADMIN/OPS podem indicar o userId.
    const userId = isPrivileged ? body.userId : id;
    return this.createCollectionRequestUseCase.call({ ...body, userId });
  }

  // Solicitações elegíveis para entrar numa rota. Mantido como rota própria
  // porque DRIVER tem acesso a esta e não à listagem geral.
  @Get('created')
  @Roles(Role.ADMIN, Role.OPS, Role.DRIVER)
  getCreatedCollectionRequests(@Query() query: GetCollectionRequestsDto) {
    return this.getAllCollectionRequestsUseCase.call({
      ...query,
      status: CollectionRequestStatus.CREATED,
      unrouted: true,
    });
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.OPS, Role.USER)
  getCollectionRequestById(@Req() req: Request, @Param('id') id: string) {
    const { id: requesterId, isPrivileged } = requesterFrom(req);
    return this.getCollectionRequestByIdUseCase.call({
      id,
      requesterId,
      isPrivileged,
    });
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.OPS, Role.USER)
  updateCollectionRequest(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: UpdateCollectionRequestDto,
  ) {
    const { id: requesterId, isPrivileged } = requesterFrom(req);
    return this.updateCollectionRequestUseCase.call({
      id,
      data: body,
      requesterId,
      isPrivileged,
    });
  }

  // Vincula a solicitação a uma rota existente (ou retira-a, com routeId
  // null). Exclusivo do MASTER: ignora as regras de composição da rota.
  @Put(':id/route')
  @Roles(Role.MASTER)
  setRoute(@Param('id') id: string, @Body() body: SetCollectionRequestRouteDto) {
    return this.setCollectionRequestRouteUseCase.call({
      collectionRequestId: id,
      routeId: body.routeId ?? null,
    });
  }
}
