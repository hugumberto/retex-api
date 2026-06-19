import { Inject, Injectable } from '@nestjs/common';
import { Package } from '../../../../domain/package/package.entity';
import { IPackageRepository } from '../../../../domain/package/package.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

@Injectable()
export class GetUserPackagesUseCase implements IUseCase<{ userId: string }, Package[]> {
  constructor(
    @Inject(DOMAIN_TOKENS.PACKAGE_REPOSITORY)
    private readonly packageRepository: IPackageRepository,
  ) {}

  async call(param: { userId: string }): Promise<Package[]> {
    return this.packageRepository.findByUser(param.userId);
  }
}
