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

  @Get(':packageId')
  async get(@Param('packageId') packageId: string) {
    return this.getCollectionUseCase.call(packageId);
  }

  @Post(':packageId/bind')
  async bind(
    @Param('packageId') packageId: string,
    @Body() dto: BindQrCodeDto,
  ) {
    return this.bindQrCodeUseCase.call({ packageId, code: dto.code });
  }

  @Post(':packageId/finalize')
  async finalize(@Param('packageId') packageId: string) {
    return this.finalizeCollectionUseCase.call(packageId);
  }

  @Post(':packageId/cancel')
  async cancel(
    @Param('packageId') packageId: string,
    @Body() dto: CancelCollectionDto,
  ) {
    return this.cancelCollectionUseCase.call({ packageId, reason: dto.reason });
  }
}
