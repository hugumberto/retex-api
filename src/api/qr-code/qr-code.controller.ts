import { Controller, Delete, Get, Param, Patch } from '@nestjs/common';
import { DeleteQrCodeUseCase } from '../../app/use-cases/qr-code/delete-qr-code-use-case';
import { GetCollectionRequestVolumesUseCase } from '../../app/use-cases/qr-code/get-collection-request-volumes-use-case';
import { UnassignQrCodeUseCase } from '../../app/use-cases/qr-code/unassign-qr-code-use-case';
import { Role } from '../../domain/user/user-roles.entity';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('qr-code')
@Roles(Role.ADMIN)
export class QrCodeController {
  constructor(
    private readonly getCollectionRequestVolumesUseCase: GetCollectionRequestVolumesUseCase,
    private readonly unassignQrCodeUseCase: UnassignQrCodeUseCase,
    private readonly deleteQrCodeUseCase: DeleteQrCodeUseCase,
  ) {}

  // Lista os volumes de uma solicitação de recolha (por código amigável ou UUID).
  @Get('collection-request/:code')
  getCollectionRequestVolumes(@Param('code') code: string) {
    return this.getCollectionRequestVolumesUseCase.call(code);
  }

  // Desassocia o volume da solicitação (volta ao pool da rota).
  @Patch(':id/unassign')
  unassign(@Param('id') id: string) {
    return this.unassignQrCodeUseCase.call(id);
  }

  // Elimina (soft-delete) o volume.
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.deleteQrCodeUseCase.call(id);
  }
}
