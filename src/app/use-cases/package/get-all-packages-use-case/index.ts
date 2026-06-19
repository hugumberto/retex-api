import { Inject, Injectable } from '@nestjs/common';
import { Package } from '../../../../domain/package/package.entity';
import { IPackageRepository } from '../../../../domain/package/package.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

@Injectable()
export class GetAllPackagesUseCase implements IUseCase<void, Package[]> {
  constructor(
    @Inject(DOMAIN_TOKENS.PACKAGE_REPOSITORY)
    private readonly packageRepository: IPackageRepository,
  ) {}

  async call(): Promise<Package[]> {
    return this.packageRepository.findAll();
  }
}
