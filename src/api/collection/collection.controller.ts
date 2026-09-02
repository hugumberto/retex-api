import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  BindQrCodeDto,
  BindQrCodeUseCase,
  CancelCollectionUseCase,
  FinalizeCollectionUseCase,
} from '../../app/use-cases/collection';
import { CancelCollectionDto } from '../../app/use-cases/collection/cancel-collection-use-case/cancel-collection.dto';
import { CreateCollectionRequestBagUseCase } from '../../app/use-cases/collection-request-bag/create-collection-request-bag-use-case';
import { GetCollectionRequestDetailUseCase } from '../../app/use-cases/collection-request/get-collection-request-detail-use-case';
import { Role } from '../../domain/user/user-roles.entity';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('collection')
@Roles(Role.ADMIN, Role.DRIVER)
export class CollectionController {
  constructor(
    private readonly getCollectionRequestDetailUseCase: GetCollectionRequestDetailUseCase,
    private readonly bindQrCodeUseCase: BindQrCodeUseCase,
    private readonly finalizeCollectionUseCase: FinalizeCollectionUseCase,
    private readonly cancelCollectionUseCase: CancelCollectionUseCase,
    private readonly createCollectionRequestBagUseCase: CreateCollectionRequestBagUseCase,
  ) { }

  @Get(':collectionRequestId')
  async get(@Param('collectionRequestId') collectionRequestId: string) {
    return this.getCollectionRequestDetailUseCase.call(collectionRequestId);
  }

  @Post(':collectionRequestId/bind')
  async bind(
    @Param('collectionRequestId') collectionRequestId: string,
    @Body() dto: BindQrCodeDto,
  ) {
    return this.bindQrCodeUseCase.call({ collectionRequestId, code: dto.code });
  }

  /**
   * Cria um saco novo já vinculado à solicitação, em qualquer estado. Exclusivo
   * do MASTER (o `@Roles` do método sobrepõe-se ao da classe): é a saída para
   * quando não há etiqueta impressa disponível, e por isso ignora a regra de
   * estado que o `bind` aplica.
   */
  @Post(':collectionRequestId/bag')
  @Roles(Role.MASTER)
  async createBag(@Param('collectionRequestId') collectionRequestId: string) {
    return this.createCollectionRequestBagUseCase.call({ collectionRequestId });
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
