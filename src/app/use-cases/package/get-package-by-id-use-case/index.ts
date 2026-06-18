import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Package } from '../../../../domain/package/package.entity';
import { IPackageRepository } from '../../../../domain/package/package.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

@Injectable()
export class GetPackageByIdUseCase implements IUseCase<string, Package> {
  constructor(
    @Inject(DOMAIN_TOKENS.PACKAGE_REPOSITORY)
    private readonly packageRepository: IPackageRepository,
  ) {}

  async call(id: string): Promise<Package> {
    const pkg = await this.packageRepository.findOneWithAllRelations(id);

    if (!pkg) {
      throw new NotFoundException('Package não encontrado');
    }

    return pkg;
  }
}
