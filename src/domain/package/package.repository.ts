import { PaginatedResult, PaginationParams } from '../interfaces/pagination.interface';
import { IRepository } from '../interfaces/repository.interface';
import { Package, PackageStatus } from './package.entity';

export interface PackageFilters {
  status?: PackageStatus;
  collectDay?: string;
  collectTime?: string;
}

export interface IPackageRepository extends IRepository<Package> {
  findByFiltersWithPagination(
    filters: PackageFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResult<Package>>;
} 