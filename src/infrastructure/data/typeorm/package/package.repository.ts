import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ILocalStorageService } from '../../../../app/services/local-storage/local-storage.service';
import { SERVICE_TOKENS } from '../../../../app/services/tokens';
import {
  PaginatedResult,
  PaginationParams,
} from '../../../../domain/interfaces/pagination.interface';
import { Package } from '../../../../domain/package/package.entity';
import {
  IPackageRepository,
  PackageFilters,
} from '../../../../domain/package/package.repository';
import { BaseRepository } from '../abstraction/base.repository';
import { packageSchema } from './package.schema';

@Injectable()
export class PackageRepository
  extends BaseRepository<Package>
  implements IPackageRepository
{
  constructor(
    @InjectRepository(packageSchema)
    packageRepository: Repository<Package>,
    @Inject(SERVICE_TOKENS.LOCAL_STORAGE_SERVICE)
    localStorageService: ILocalStorageService,
  ) {
    super(packageRepository, localStorageService);
  }

  async findByFiltersWithPagination(
    filters: PackageFilters,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<Package>> {
    const repository = await this.getRepository();
    const queryBuilder = repository.createQueryBuilder('package');

    // Adicionar filtros
    if (filters.status) {
      queryBuilder.andWhere('package.status = :status', {
        status: filters.status,
      });
    }

    if (filters.collectDay) {
      queryBuilder.andWhere('package.collectDay = :collectDay', {
        collectDay: filters.collectDay,
      });
    }

    if (filters.collectTime) {
      queryBuilder.andWhere('package.collectTime = :collectTime', {
        collectTime: filters.collectTime,
      });
    }

    // Incluir relacionamentos
    queryBuilder
      .leftJoinAndSelect('package.user', 'user')
      .leftJoinAndSelect('package.route', 'route')
      .leftJoinAndSelect('package.items', 'items');

    // Aplicar paginação
    const offset = (pagination.page - 1) * pagination.limit;
    queryBuilder.skip(offset).take(pagination.limit);

    // Ordenar por data de criação (mais recentes primeiro)
    queryBuilder.orderBy('package.createdAt', 'DESC');

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

  async findOneWithAllRelations(id: string): Promise<Package> {
    const repository = await this.getRepository();
    return repository
      .createQueryBuilder('package')
      .leftJoinAndSelect('package.user', 'user')
      .leftJoinAndSelect('package.route', 'route')
      .leftJoinAndSelect('package.items', 'items')
      .where('package.id = :id', { id })
      .getOne();
  }
}
