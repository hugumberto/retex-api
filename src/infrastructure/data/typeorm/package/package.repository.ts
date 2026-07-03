import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ILocalStorageService } from '../../../../app/services/local-storage/local-storage.service';
import { SERVICE_TOKENS } from '../../../../app/services/tokens';
import {
  PaginatedResult,
  PaginationParams,
} from '../../../../domain/interfaces/pagination.interface';
import { Package, PackageStatus } from '../../../../domain/package/package.entity';
import {
  CityCount,
  IPackageRepository,
  PackageFilters,
  PackageStatusCount,
  PackageTotals,
  PackageTrendPoint,
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

    // Incluir relacionamentos (address é necessário para plotar lat/long no mapa)
    queryBuilder
      .leftJoinAndSelect('package.user', 'user')
      .leftJoinAndSelect('package.address', 'address')
      .leftJoinAndSelect('package.route', 'route')
      .leftJoinAndSelect('package.items', 'items');

    // Apenas encomendas ainda não vinculadas a uma rota
    if (filters.unrouted) {
      queryBuilder.andWhere('route.id IS NULL');
    }

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

  async findByUser(userId: string): Promise<Package[]> {
    const repository = await this.getRepository();
    return repository
      .createQueryBuilder('package')
      .leftJoinAndSelect('package.user', 'user')
      .leftJoinAndSelect('package.address', 'address')
      .leftJoinAndSelect('package.route', 'route')
      .where('user.id = :userId', { userId })
      .orderBy('package.createdAt', 'DESC')
      .getMany();
  }

  async findAll(): Promise<Package[]> {
    const repository = await this.getRepository();
    return repository
      .createQueryBuilder('package')
      .leftJoinAndSelect('package.user', 'user')
      .leftJoinAndSelect('package.address', 'address')
      .leftJoinAndSelect('package.route', 'route')
      .orderBy('package.createdAt', 'DESC')
      .getMany();
  }

  async countByStatus(): Promise<PackageStatusCount[]> {
    const repository = await this.getRepository();
    const rows = await repository
      .createQueryBuilder('package')
      .select('package.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('package.status')
      .getRawMany<{ status: PackageStatus; count: string }>();

    return rows.map((row) => ({
      status: row.status,
      count: Number(row.count),
    }));
  }

  async getTotals(): Promise<PackageTotals> {
    const repository = await this.getRepository();
    const row = await repository
      .createQueryBuilder('package')
      .select('COUNT(*)', 'totalPackages')
      .addSelect('COALESCE(SUM(package.weight), 0)', 'totalWeight')
      .addSelect('COALESCE(SUM(package.estimatedVolumes), 0)', 'totalVolumes')
      .getRawOne<{
        totalPackages: string;
        totalWeight: string;
        totalVolumes: string;
      }>();

    return {
      totalPackages: Number(row?.totalPackages ?? 0),
      totalWeight: Number(row?.totalWeight ?? 0),
      totalVolumes: Number(row?.totalVolumes ?? 0),
    };
  }

  async getWeightTrend(months: number): Promise<PackageTrendPoint[]> {
    const repository = await this.getRepository();
    const rows = await repository
      .createQueryBuilder('package')
      .select("to_char(date_trunc('month', package.createdAt), 'YYYY-MM')", 'period')
      .addSelect('COALESCE(SUM(package.weight), 0)', 'weight')
      .addSelect('COUNT(*)', 'count')
      .where("package.createdAt >= now() - (:months * interval '1 month')", {
        months: Math.max(0, months - 1),
      })
      .groupBy("date_trunc('month', package.createdAt)")
      .orderBy("date_trunc('month', package.createdAt)", 'ASC')
      .getRawMany<{ period: string; weight: string; count: string }>();

    return rows.map((row) => ({
      period: row.period,
      weightKg: Number(row.weight),
      count: Number(row.count),
    }));
  }

  async countOutOfZoneByCity(limit: number): Promise<CityCount[]> {
    const repository = await this.getRepository();
    const rows = await repository
      .createQueryBuilder('package')
      .innerJoin('package.address', 'address')
      .select('address.city', 'city')
      .addSelect('COUNT(*)', 'count')
      .where('package.status = :status', {
        status: PackageStatus.OUT_OF_ZONE,
      })
      .groupBy('address.city')
      .orderBy('COUNT(*)', 'DESC')
      .limit(limit)
      .getRawMany<{ city: string; count: string }>();

    return rows.map((row) => ({
      city: row.city,
      count: Number(row.count),
    }));
  }

  async findOneWithAllRelations(id: string): Promise<Package> {
    const repository = await this.getRepository();
    return repository
      .createQueryBuilder('package')
      .leftJoinAndSelect('package.user', 'user')
      .leftJoinAndSelect('package.address', 'address')
      .leftJoinAndSelect('package.route', 'route')
      .leftJoinAndSelect('package.items', 'items')
      .leftJoinAndSelect('items.brand', 'brand')
      .leftJoinAndSelect('items.storageUnit', 'storageUnit')
      .where('package.id = :id', { id })
      .getOne();
  }
}
