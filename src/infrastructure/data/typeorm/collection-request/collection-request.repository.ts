import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ILocalStorageService } from '../../../../app/services/local-storage/local-storage.service';
import { SERVICE_TOKENS } from '../../../../app/services/tokens';
import {
  PaginatedResult,
  PaginationParams,
} from '../../../../domain/interfaces/pagination.interface';
import {
  CollectionRequest,
  CollectionRequestStatus,
} from '../../../../domain/collection-request/collection-request.entity';
import {
  CityCount,
  ICollectionRequestRepository,
  CollectionRequestFilters,
  CollectionRequestStatusCount,
  CollectionRequestTotals,
  CollectionRequestTrendPoint,
} from '../../../../domain/collection-request/collection-request.repository';
import { BaseRepository } from '../abstraction/base.repository';
import { collectionRequestSchema } from './collection-request.schema';

@Injectable()
export class CollectionRequestRepository
  extends BaseRepository<CollectionRequest>
  implements ICollectionRequestRepository
{
  constructor(
    @InjectRepository(collectionRequestSchema)
    collectionRequestRepository: Repository<CollectionRequest>,
    @Inject(SERVICE_TOKENS.LOCAL_STORAGE_SERVICE)
    localStorageService: ILocalStorageService,
  ) {
    super(collectionRequestRepository, localStorageService);
  }

  async findByFiltersWithPagination(
    filters: CollectionRequestFilters,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<CollectionRequest>> {
    const repository = await this.getRepository();
    const queryBuilder = repository.createQueryBuilder('collectionRequest');

    // Adicionar filtros
    if (filters.status) {
      queryBuilder.andWhere('collectionRequest.status = :status', {
        status: filters.status,
      });
    }

    // Incluir relacionamentos (address é necessário para plotar lat/long no mapa)
    queryBuilder
      .leftJoinAndSelect('collectionRequest.user', 'user')
      .leftJoinAndSelect('collectionRequest.address', 'address')
      .leftJoinAndSelect('collectionRequest.route', 'route')
      .leftJoinAndSelect('collectionRequest.items', 'items');

    // Apenas solicitações ainda não vinculadas a uma rota
    if (filters.unrouted) {
      queryBuilder.andWhere('route.id IS NULL');
    }

    // Aplicar paginação
    const offset = (pagination.page - 1) * pagination.limit;
    queryBuilder.skip(offset).take(pagination.limit);

    // Ordenar por data de criação (mais recentes primeiro)
    queryBuilder.orderBy('collectionRequest.createdAt', 'DESC');

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

  async findByUser(userId: string): Promise<CollectionRequest[]> {
    const repository = await this.getRepository();
    return repository
      .createQueryBuilder('collectionRequest')
      .leftJoinAndSelect('collectionRequest.user', 'user')
      .leftJoinAndSelect('collectionRequest.address', 'address')
      .leftJoinAndSelect('collectionRequest.route', 'route')
      .where('user.id = :userId', { userId })
      .orderBy('collectionRequest.createdAt', 'DESC')
      .getMany();
  }

  async findAll(): Promise<CollectionRequest[]> {
    const repository = await this.getRepository();
    return repository
      .createQueryBuilder('collectionRequest')
      .leftJoinAndSelect('collectionRequest.user', 'user')
      .leftJoinAndSelect('collectionRequest.address', 'address')
      .leftJoinAndSelect('collectionRequest.route', 'route')
      .orderBy('collectionRequest.createdAt', 'DESC')
      .getMany();
  }

  async countByStatus(): Promise<CollectionRequestStatusCount[]> {
    const repository = await this.getRepository();
    const rows = await repository
      .createQueryBuilder('collectionRequest')
      .select('collectionRequest.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('collectionRequest.status')
      .getRawMany<{ status: CollectionRequestStatus; count: string }>();

    return rows.map((row) => ({
      status: row.status,
      count: Number(row.count),
    }));
  }

  async getTotals(): Promise<CollectionRequestTotals> {
    const repository = await this.getRepository();
    const row = await repository
      .createQueryBuilder('collectionRequest')
      .select('COUNT(*)', 'totalCollectionRequests')
      .addSelect('COALESCE(SUM(collectionRequest.weight), 0)', 'totalWeight')
      .addSelect(
        'COALESCE(SUM(collectionRequest.estimatedVolumes), 0)',
        'totalVolumes',
      )
      .getRawOne<{
        totalCollectionRequests: string;
        totalWeight: string;
        totalVolumes: string;
      }>();

    return {
      totalCollectionRequests: Number(row?.totalCollectionRequests ?? 0),
      totalWeight: Number(row?.totalWeight ?? 0),
      totalVolumes: Number(row?.totalVolumes ?? 0),
    };
  }

  async getWeightTrend(months: number): Promise<CollectionRequestTrendPoint[]> {
    const repository = await this.getRepository();
    const rows = await repository
      .createQueryBuilder('collectionRequest')
      .select(
        "to_char(date_trunc('month', collectionRequest.createdAt), 'YYYY-MM')",
        'period',
      )
      .addSelect('COALESCE(SUM(collectionRequest.weight), 0)', 'weight')
      .addSelect('COUNT(*)', 'count')
      .where(
        "collectionRequest.createdAt >= now() - (:months * interval '1 month')",
        {
          months: Math.max(0, months - 1),
        },
      )
      .groupBy("date_trunc('month', collectionRequest.createdAt)")
      .orderBy("date_trunc('month', collectionRequest.createdAt)", 'ASC')
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
      .createQueryBuilder('collectionRequest')
      .innerJoin('collectionRequest.address', 'address')
      .select('address.city', 'city')
      .addSelect('COUNT(*)', 'count')
      .where('collectionRequest.status = :status', {
        status: CollectionRequestStatus.OUT_OF_ZONE,
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

  async findOneWithAllRelations(id: string): Promise<CollectionRequest> {
    const repository = await this.getRepository();
    return repository
      .createQueryBuilder('collectionRequest')
      .leftJoinAndSelect('collectionRequest.user', 'user')
      .leftJoinAndSelect('collectionRequest.address', 'address')
      .leftJoinAndSelect('collectionRequest.route', 'route')
      .leftJoinAndSelect('collectionRequest.items', 'items')
      .leftJoinAndSelect('items.brand', 'brand')
      .leftJoinAndSelect('items.storageUnit', 'storageUnit')
      .leftJoinAndSelect('items.qrCode', 'itemQrCode')
      .where('collectionRequest.id = :id', { id })
      .getOne();
  }

  async findByCollectionConfirmationToken(
    token: string,
  ): Promise<CollectionRequest> {
    const repository = await this.getRepository();
    return repository
      .createQueryBuilder('collectionRequest')
      .addSelect('collectionRequest.collectionConfirmationToken')
      .leftJoinAndSelect('collectionRequest.user', 'user')
      .leftJoinAndSelect('collectionRequest.route', 'route')
      .where('collectionRequest.collectionConfirmationToken = :token', { token })
      .getOne();
  }

  async findExpiredUnconfirmed(days: number): Promise<CollectionRequest[]> {
    const repository = await this.getRepository();
    return repository
      .createQueryBuilder('collectionRequest')
      .innerJoinAndSelect('collectionRequest.route', 'route')
      .where('collectionRequest.status = :status', {
        status: CollectionRequestStatus.CREATED,
      })
      .andWhere('collectionRequest.collectionConfirmedAt IS NULL')
      .andWhere('(route.start_date::date - :days) < CURRENT_DATE', { days })
      .getMany();
  }

  async findDueConfirmed(): Promise<CollectionRequest[]> {
    const repository = await this.getRepository();
    return repository
      .createQueryBuilder('collectionRequest')
      .innerJoinAndSelect('collectionRequest.route', 'route')
      .where('collectionRequest.status = :status', {
        status: CollectionRequestStatus.CONFIRMED,
      })
      .andWhere('collectionRequest.collectionConfirmedAt IS NOT NULL')
      .andWhere('route.start_date::date <= CURRENT_DATE')
      .getMany();
  }
}
