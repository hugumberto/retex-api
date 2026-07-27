import { Controller, Delete, Get, Param, Patch } from '@nestjs/common';
import { DeleteQrCodeUseCase } from '../../app/use-cases/qr-code/delete-qr-code-use-case';
import { GetPackageVolumesUseCase } from '../../app/use-cases/qr-code/get-package-volumes-use-case';
import { UnassignQrCodeUseCase } from '../../app/use-cases/qr-code/unassign-qr-code-use-case';
import { Role } from '../../domain/user/user-roles.entity';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('qr-code')
@Roles(Role.ADMIN)
export class QrCodeController {
  constructor(
    private readonly getPackageVolumesUseCase: GetPackageVolumesUseCase,
    private readonly unassignQrCodeUseCase: UnassignQrCodeUseCase,
    private readonly deleteQrCodeUseCase: DeleteQrCodeUseCase,
  ) {}

  // Lista os volumes de um pacote (por código amigável ou UUID).
  @Get('package/:code')
  getPackageVolumes(@Param('code') code: string) {
    return this.getPackageVolumesUseCase.call(code);
  }

  // Desassocia o volume do pacote (volta ao pool da rota).
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
