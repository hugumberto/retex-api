import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  BindQrCodeDto,
  BindQrCodeUseCase,
  CancelCollectionUseCase,
  FinalizeCollectionUseCase,
  GetCollectionUseCase,
} from '../../app/use-cases/collection';
import { CancelCollectionDto } from '../../app/use-cases/collection/cancel-collection-use-case/cancel-collection.dto';
import { Role } from '../../domain/user/user-roles.entity';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('collection')
@Roles(Role.ADMIN, Role.DRIVER)
export class CollectionController {
  constructor(
    private readonly getCollectionUseCase: GetCollectionUseCase,
    private readonly bindQrCodeUseCase: BindQrCodeUseCase,
    private readonly finalizeCollectionUseCase: FinalizeCollectionUseCase,
    private readonly cancelCollectionUseCase: CancelCollectionUseCase,
  ) { }

  @Get(':collectionRequestId')
  async get(@Param('collectionRequestId') collectionRequestId: string) {
    return this.getCollectionUseCase.call(collectionRequestId);
  }

  @Post(':collectionRequestId/bind')
  async bind(
    @Param('collectionRequestId') collectionRequestId: string,
    @Body() dto: BindQrCodeDto,
  ) {
    return this.bindQrCodeUseCase.call({ collectionRequestId, code: dto.code });
  }

  @Post(':collectionRequestId/finalize')
  async finalize(@Param('collectionRequestId') collectionRequestId: string) {
    return this.finalizeCollectionUseCase.call(collectionRequestId);
  }

  @Post(':collectionRequestId/cancel')
  async cancel(
    @Param('collectionRequestId') collectionRequestId: string,
    @Body() dto: CancelCollectionDto,
  ) {
    return this.cancelCollectionUseCase.call({ collectionRequestId, reason: dto.reason });
  }
}
