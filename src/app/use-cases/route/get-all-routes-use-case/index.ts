import { Inject, Injectable } from '@nestjs/common';
import { PaginatedResult } from '../../../../domain/interfaces/pagination.interface';
import { Route } from '../../../../domain/route/route.entity';
import { IRouteRepository } from '../../../../domain/route/route.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { GetAllRoutesDto } from './get-all-routes.dto';

@Injectable()
export class GetAllRoutesUseCase implements IUseCase<GetAllRoutesDto, PaginatedResult<Route>> {
  constructor(
    @Inject(DOMAIN_TOKENS.ROUTE_REPOSITORY)
    private readonly routeRepository: IRouteRepository,
  ) { }

  async call(param: GetAllRoutesDto): Promise<PaginatedResult<Route>> {
    const filters = {
      status: param.status,
      driverId: param.driverId,
    };

    const pagination = {
      page: param.page || 1,
      limit: param.limit || 10,
    };

    return this.routeRepository.findByFiltersWithPagination(filters, pagination);
  }
} 