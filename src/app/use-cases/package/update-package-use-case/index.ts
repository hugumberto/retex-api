import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Package, PackageStatus } from '../../../../domain/package/package.entity';
import { IPackageRepository } from '../../../../domain/package/package.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { UpdatePackageDto } from './update-package.dto';

export interface UpdatePackageParamDto {
  id: string;
  data: UpdatePackageDto;
  requesterId: string;
  isPrivileged: boolean;
}

@Injectable()
export class UpdatePackageUseCase
  implements IUseCase<UpdatePackageParamDto, Package>
{
  constructor(
    @Inject(DOMAIN_TOKENS.PACKAGE_REPOSITORY)
    private readonly packageRepository: IPackageRepository,
  ) {}

  async call(param: UpdatePackageParamDto): Promise<Package> {
    const { id, data, requesterId, isPrivileged } = param;

    const existingPackage = await this.packageRepository.findOneWithAllRelations(id);
    if (!existingPackage) {
      throw new NotFoundException('Package não encontrado');
    }

    // USER só pode mexer nos próprios pacotes e apenas para CANCELAR.
    if (!isPrivileged) {
      if (existingPackage.user?.id !== requesterId) {
        throw new NotFoundException('Package não encontrado');
      }
      if (data.status !== PackageStatus.CANCELLED) {
        throw new ForbiddenException(
          'Apenas é permitido cancelar a própria solicitação',
        );
      }
    }

    const updateData: Partial<Package> = {};

    if (data.status) {
      updateData.status = data.status;
    }

    // Peso só é definido por operadores (triagem), não pelo utilizador.
    if (isPrivileged && data.weight && data.weight > 0) {
      updateData.weight = data.weight;
    }

    if (Object.keys(updateData).length === 0) {
      return existingPackage;
    }

    const [updatedPackage] = await this.packageRepository.update(
      { id },
      updateData,
    );
    return updatedPackage;
  }
}
