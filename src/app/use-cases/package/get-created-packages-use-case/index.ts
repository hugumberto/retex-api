import { Inject, Injectable } from '@nestjs/common';
import { PaginatedResult } from '../../../../domain/interfaces/pagination.interface';
import { Package, PackageStatus } from '../../../../domain/package/package.entity';
import { IPackageRepository } from '../../../../domain/package/package.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { GetCreatedPackagesDto } from './get-created-packages.dto';

@Injectable()
export class GetCreatedPackagesUseCase implements IUseCase<GetCreatedPackagesDto, PaginatedResult<Package>> {
  constructor(
    @Inject(DOMAIN_TOKENS.PACKAGE_REPOSITORY)
    private readonly packageRepository: IPackageRepository,
  ) { }

  async call(param: GetCreatedPackagesDto): Promise<PaginatedResult<Package>> {
    const filters = {
      status: PackageStatus.CREATED,
      collectDay: param.collectDay,
      collectTime: param.collectTime,
    };

    const pagination = {
      page: param.page || 1,
      limit: param.limit || 10,
    };

    return this.packageRepository.findByFiltersWithPagination(filters, pagination);
  }
} 