import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ILocalStorageService } from '../../../../app/services/local-storage/local-storage.service';
import { SERVICE_TOKENS } from '../../../../app/services/tokens';
import { PaginatedResult, PaginationParams } from '../../../../domain/interfaces/pagination.interface';
import { Route } from '../../../../domain/route/route.entity';
import { IRouteRepository, RouteFilters } from '../../../../domain/route/route.repository';
import { BaseRepository } from '../abstraction/base.repository';
import { routeSchema } from './route.schema';

@Injectable()
export class RouteRepository extends BaseRepository<Route> implements IRouteRepository {
  constructor(
    @InjectRepository(routeSchema)
    routeRepository: Repository<Route>,
    @Inject(SERVICE_TOKENS.LOCAL_STORAGE_SERVICE)
    localStorageService: ILocalStorageService,
  ) {
    super(routeRepository, localStorageService);
  }

  async findByFiltersWithPagination(
    filters: RouteFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResult<Route>> {
    const repository = await this.getRepository();
    const queryBuilder = repository.createQueryBuilder('route');

    // Adicionar filtros
    if (filters.status) {
      queryBuilder.andWhere('route.status = :status', { status: filters.status });
    }

    if (filters.driverId) {
      queryBuilder.andWhere('route.driverId = :driverId', { driverId: filters.driverId });
    }

    // Incluir relacionamentos (SEM packages para performance)
    queryBuilder
      .leftJoinAndSelect('route.driver', 'driver')
      .leftJoinAndSelect('driver.roles', 'driverRoles')
      .loadRelationCountAndMap('route.packagesCount', 'route.packages');

    // Aplicar paginação
    const offset = (pagination.page - 1) * pagination.limit;
    queryBuilder.skip(offset).take(pagination.limit);

    // Ordenar por data de criação (mais recentes primeiro)
    queryBuilder.orderBy('route.createdAt', 'DESC');

    // Executar consulta
    const [data, total] = await queryBuilder.getManyAndCount();

    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data,
      meta: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages,
      },
    };
  }

  async findOneWithAllRelations(id: string): Promise<Route> {
    const repository = await this.getRepository();
    return repository
      .createQueryBuilder('route')
      .leftJoinAndSelect('route.driver', 'driver')
      .leftJoinAndSelect('driver.roles', 'driverRoles')
      .leftJoinAndSelect('route.packages', 'packages')
      .leftJoinAndSelect('packages.user', 'packageUser')
      .where('route.id = :id', { id })
      .getOne();
  }
} 