import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtPayload } from '../../app/services/interfaces/auth.interface';
import { ConfirmCollectionUseCase } from '../../app/use-cases/collection-request/confirm-collection-use-case';
import { ConfirmCollectionDto } from '../../app/use-cases/collection-request/confirm-collection-use-case/confirm-collection.dto';
import { RejectCollectionUseCase } from '../../app/use-cases/collection-request/reject-collection-use-case';
import { RejectCollectionDto } from '../../app/use-cases/collection-request/reject-collection-use-case/reject-collection.dto';
import { CreateCollectionRequestUseCase } from '../../app/use-cases/collection-request/create-collection-request-use-case';
import { CreateCollectionRequestDto } from '../../app/use-cases/collection-request/create-collection-request-use-case/create-collection-request.dto';
import { GetAllCollectionRequestsUseCase } from '../../app/use-cases/collection-request/get-all-collection-requests-use-case';
import { GetCreatedCollectionRequestsUseCase } from '../../app/use-cases/collection-request/get-created-collection-requests-use-case';
import { GetCreatedCollectionRequestsDto } from '../../app/use-cases/collection-request/get-created-collection-requests-use-case/get-created-collection-requests.dto';
import { GetCollectionRequestByIdUseCase } from '../../app/use-cases/collection-request/get-collection-request-by-id-use-case';
import { UpdateCollectionRequestUseCase } from '../../app/use-cases/collection-request/update-collection-request-use-case';
import { UpdateCollectionRequestDto } from '../../app/use-cases/collection-request/update-collection-request-use-case/update-collection-request.dto';
import { Role } from '../../domain/user/user-roles.entity';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

function requesterFrom(req: Request): { id: string; isPrivileged: boolean } {
  const user = req['user'] as JwtPayload;
  const isPrivileged = !!user?.roles?.some(
    (role) => role === Role.ADMIN || role === Role.OPS,
  );
  return { id: user?.sub, isPrivileged };
}

@Controller('collection-request')
export class CollectionRequestController {
  constructor(
    private readonly createCollectionRequestUseCase: CreateCollectionRequestUseCase,
    private readonly getCreatedCollectionRequestsUseCase: GetCreatedCollectionRequestsUseCase,
    private readonly getCollectionRequestByIdUseCase: GetCollectionRequestByIdUseCase,
    private readonly updateCollectionRequestUseCase: UpdateCollectionRequestUseCase,
    private readonly getAllCollectionRequestsUseCase: GetAllCollectionRequestsUseCase,
    private readonly confirmCollectionUseCase: ConfirmCollectionUseCase,
    private readonly rejectCollectionUseCase: RejectCollectionUseCase,
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
  getAll() {
    return this.getAllCollectionRequestsUseCase.call();
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

  @Get('created')
  @Roles(Role.ADMIN, Role.OPS, Role.DRIVER)
  getCreatedCollectionRequests(@Query() query: GetCreatedCollectionRequestsDto) {
    return this.getCreatedCollectionRequestsUseCase.call(query);
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
}
