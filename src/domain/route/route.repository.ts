import { PaginatedResult, PaginationParams } from '../interfaces/pagination.interface';
import { IRepository } from '../interfaces/repository.interface';
import { Route, RouteStatus } from './route.entity';

export interface RouteFilters {
  status?: RouteStatus;
  driverId?: string;
}

export interface IRouteRepository extends IRepository<Route> {
  findByFiltersWithPagination(
    filters: RouteFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResult<Route>>;

  findOneWithAllRelations(id: string): Promise<Route>;
} 