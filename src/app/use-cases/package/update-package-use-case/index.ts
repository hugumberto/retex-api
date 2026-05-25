import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Package } from '../../../../domain/package/package.entity';
import { IPackageRepository } from '../../../../domain/package/package.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { UpdatePackageDto } from './update-package.dto';

export interface UpdatePackageParamDto {
  id: string;
  data: UpdatePackageDto;
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
    const { id, data } = param;

    const existingPackage = await this.packageRepository.findOne({ id });
    if (!existingPackage) {
      throw new NotFoundException('Package não encontrado');
    }

    const updateData: Partial<Package> = {};

    if (data.status) {
      updateData.status = data.status;
    }

    if (data.weight && data.weight > 0) {
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
