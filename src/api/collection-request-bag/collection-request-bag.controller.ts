import { Controller, Delete, Get, Param, Patch } from '@nestjs/common';
import { DeleteCollectionRequestBagUseCase } from '../../app/use-cases/collection-request-bag/delete-collection-request-bag-use-case';
import { GetCollectionRequestBagsUseCase } from '../../app/use-cases/collection-request-bag/get-collection-request-bags-use-case';
import { UnassignCollectionRequestBagUseCase } from '../../app/use-cases/collection-request-bag/unassign-collection-request-bag-use-case';
import { Role } from '../../domain/user/user-roles.entity';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('collection-request-bag')
@Roles(Role.ADMIN)
export class CollectionRequestBagController {
  constructor(
    private readonly getCollectionRequestBagsUseCase: GetCollectionRequestBagsUseCase,
    private readonly unassignCollectionRequestBagUseCase: UnassignCollectionRequestBagUseCase,
    private readonly deleteCollectionRequestBagUseCase: DeleteCollectionRequestBagUseCase,
  ) {}

  // Lista os sacos de uma solicitação de recolha (por código amigável ou UUID).
  @Get('collection-request/:code')
  getCollectionRequestBags(@Param('code') code: string) {
    return this.getCollectionRequestBagsUseCase.call(code);
  }

  // Desassocia o saco da solicitação (volta ao pool da rota).
  @Patch(':id/unassign')
  unassign(@Param('id') id: string) {
    return this.unassignCollectionRequestBagUseCase.call(id);
  }

  // Elimina (soft-delete) o saco.
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.deleteCollectionRequestBagUseCase.call(id);
  }
}
