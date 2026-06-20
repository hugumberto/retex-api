import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Package } from '../../../../domain/package/package.entity';
import { IPackageRepository } from '../../../../domain/package/package.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

export interface GetPackageByIdParam {
  id: string;
  requesterId: string;
  isPrivileged: boolean;
}

@Injectable()
export class GetPackageByIdUseCase implements IUseCase<GetPackageByIdParam, Package> {
  constructor(
    @Inject(DOMAIN_TOKENS.PACKAGE_REPOSITORY)
    private readonly packageRepository: IPackageRepository,
  ) {}

  async call(param: GetPackageByIdParam): Promise<Package> {
    const pkg = await this.packageRepository.findOneWithAllRelations(param.id);

    if (!pkg) {
      throw new NotFoundException('Package não encontrado');
    }

    // USER só pode ver os próprios pacotes; ADMIN/OPS veem todos.
    // Devolvemos 404 (e não 403) para não revelar a existência a terceiros.
    if (!param.isPrivileged && pkg.user?.id !== param.requesterId) {
      throw new NotFoundException('Package não encontrado');
    }

    return pkg;
  }
}
