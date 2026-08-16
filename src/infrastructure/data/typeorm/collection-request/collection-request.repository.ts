import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
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
  AddressCollectionCount,
  CityCount,
  DashboardScope,
  ICollectionRequestRepository,
  CollectionRequestFilters,
  CollectionRequestStatusCount,
  CollectionRequestTotals,
  CollectionRequestTrendPoint,
  MemberCollectionCount,
} from '../../../../domain/collection-request/collection-request.repository';
import { RouteStatus } from '../../../../domain/route/route.entity';
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
      // Sem esta relação o crachá de empresa no portal fica sem nome, e é o nome
      // que permite agrupar as recolhas do mesmo cliente na construção da rota.
      .leftJoinAndSelect('collectionRequest.company', 'company')
      .leftJoinAndSelect('collectionRequest.address', 'address')
      .leftJoinAndSelect('collectionRequest.route', 'route')
      .leftJoinAndSelect('collectionRequest.items', 'items');

    if (filters.companyId) {
      queryBuilder.andWhere('collectionRequest.company_id = :companyId', {
        companyId: filters.companyId,
      });
    }

    if (filters.userId) {
      queryBuilder.andWhere('user.id = :filterUserId', {
        filterUserId: filters.userId,
      });
    }

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
      // Sem esta relação o crachá de empresa no portal fica sem nome, e é o nome
      // que permite agrupar as recolhas do mesmo cliente na construção da rota.
      .leftJoinAndSelect('collectionRequest.company', 'company')
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
      // Sem esta relação o crachá de empresa no portal fica sem nome, e é o nome
      // que permite agrupar as recolhas do mesmo cliente na construção da rota.
      .leftJoinAndSelect('collectionRequest.company', 'company')
      .leftJoinAndSelect('collectionRequest.address', 'address')
      .leftJoinAndSelect('collectionRequest.route', 'route')
      .orderBy('collectionRequest.createdAt', 'DESC')
      .getMany();
  }

  async existsActiveByAddress(addressId: string): Promise<boolean> {
    const repository = await this.getRepository();
    // getCount aplica automaticamente o filtro de soft-delete (deleted_at IS NULL).
    const count = await repository
      .createQueryBuilder('collectionRequest')
      .where('collectionRequest.addressId = :addressId', { addressId })
      .andWhere('collectionRequest.status NOT IN (:...terminal)', {
        terminal: [
          CollectionRequestStatus.STOCKED,
          CollectionRequestStatus.CANCELLED,
        ],
      })
      .getCount();
    return count > 0;
  }

  /**
   * Restringe uma agregação a uma empresa ou a um utilizador.
   *
   * `company_id` e `user_id` são colunas cruas: a primeira está mapeada no
   * EntitySchema, a segunda só existe como relação, e o QueryBuilder aceita
   * ambas por nome — é o que `findByFiltersWithPagination` já faz.
   *
   * Sempre `andWhere`: `getWeightTrend` e `countOutOfZoneByCity` já têm um
   * `where` próprio, e um segundo `where` apagava-o.
   */
  private applyScope<T>(
    queryBuilder: SelectQueryBuilder<T>,
    scope?: DashboardScope,
  ): SelectQueryBuilder<T> {
    if (scope?.companyId) {
      queryBuilder.andWhere('collectionRequest.company_id = :scopeCompanyId', {
        scopeCompanyId: scope.companyId,
      });
    }
    if (scope?.userId) {
      queryBuilder.andWhere('collectionRequest.user_id = :scopeUserId', {
        scopeUserId: scope.userId,
      });
    }
    return queryBuilder;
  }

  async countByStatus(
    scope?: DashboardScope,
  ): Promise<CollectionRequestStatusCount[]> {
    const repository = await this.getRepository();
    const rows = await this.applyScope(
      repository
        .createQueryBuilder('collectionRequest')
        .select('collectionRequest.status', 'status')
        .addSelect('COUNT(*)', 'count'),
      scope,
    )
      .groupBy('collectionRequest.status')
      .getRawMany<{ status: CollectionRequestStatus; count: string }>();

    return rows.map((row) => ({
      status: row.status,
      count: Number(row.count),
    }));
  }

  async getTotals(scope?: DashboardScope): Promise<CollectionRequestTotals> {
    const repository = await this.getRepository();
    const row = await this.applyScope(
      repository
        .createQueryBuilder('collectionRequest')
        .select('COUNT(*)', 'totalCollectionRequests')
        .addSelect('COALESCE(SUM(collectionRequest.weight), 0)', 'totalWeight')
        .addSelect(
          'COALESCE(SUM(collectionRequest.estimatedBags), 0)',
          'totalEstimatedBags',
        )
        .addSelect(
          'COALESCE(SUM(collectionRequest.bagsGenerated), 0)',
          'totalCollectedBags',
        ),
      scope,
    ).getRawOne<{
        totalCollectionRequests: string;
        totalWeight: string;
        totalEstimatedBags: string;
        totalCollectedBags: string;
      }>();

    return {
      totalCollectionRequests: Number(row?.totalCollectionRequests ?? 0),
      totalWeight: Number(row?.totalWeight ?? 0),
      totalEstimatedBags: Number(row?.totalEstimatedBags ?? 0),
      totalCollectedBags: Number(row?.totalCollectedBags ?? 0),
    };
  }

  async getWeightTrend(
    months: number,
    scope?: DashboardScope,
  ): Promise<CollectionRequestTrendPoint[]> {
    const repository = await this.getRepository();
    const rows = await this.applyScope(
      repository
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
        ),
      scope,
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

  /**
   * Repartição das recolhas de uma empresa por quem as pediu.
   *
   * `innerJoin` e não `leftJoin`: uma solicitação tem sempre autor, e um join
   * externo só abriria a porta a uma linha órfã sem nome.
   */
  async aggregateByMember(companyId: string): Promise<MemberCollectionCount[]> {
    const repository = await this.getRepository();
    const rows = await repository
      .createQueryBuilder('collectionRequest')
      .innerJoin('collectionRequest.user', 'user')
      .select('user.id', 'userId')
      .addSelect('user.firstName', 'firstName')
      .addSelect('user.lastName', 'lastName')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(collectionRequest.weight), 0)', 'weight')
      .where('collectionRequest.company_id = :companyId', { companyId })
      .groupBy('user.id')
      .addGroupBy('user.firstName')
      .addGroupBy('user.lastName')
      .orderBy('COUNT(*)', 'DESC')
      .getRawMany<{
        userId: string;
        firstName: string;
        lastName: string;
        count: string;
        weight: string;
      }>();

    return rows.map((row) => ({
      userId: row.userId,
      name: `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim(),
      count: Number(row.count),
      weightKg: Number(row.weight),
    }));
  }

  /** Repartição das recolhas de uma empresa pelos seus locais de recolha. */
  async aggregateByAddress(
    companyId: string,
  ): Promise<AddressCollectionCount[]> {
    const repository = await this.getRepository();
    const rows = await repository
      .createQueryBuilder('collectionRequest')
      .innerJoin('collectionRequest.address', 'address')
      .select('address.id', 'addressId')
      .addSelect('address.street', 'street')
      .addSelect('address.number', 'number')
      .addSelect('address.city', 'city')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(collectionRequest.weight), 0)', 'weight')
      .where('collectionRequest.company_id = :companyId', { companyId })
      .groupBy('address.id')
      .addGroupBy('address.street')
      .addGroupBy('address.number')
      .addGroupBy('address.city')
      .orderBy('COUNT(*)', 'DESC')
      .getRawMany<{
        addressId: string;
        street: string;
        number: string;
        city: string;
        count: string;
        weight: string;
      }>();

    return rows.map((row) => ({
      addressId: row.addressId,
      label: [`${row.street ?? ''} ${row.number ?? ''}`.trim(), row.city]
        .filter(Boolean)
        .join(' — '),
      count: Number(row.count),
      weightKg: Number(row.weight),
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
      // Sem esta relação o crachá de empresa no portal fica sem nome, e é o nome
      // que permite agrupar as recolhas do mesmo cliente na construção da rota.
      .leftJoinAndSelect('collectionRequest.company', 'company')
      .leftJoinAndSelect('collectionRequest.address', 'address')
      .leftJoinAndSelect('collectionRequest.route', 'route')
      .leftJoinAndSelect('collectionRequest.items', 'items')
      .leftJoinAndSelect('items.brand', 'brand')
      .leftJoinAndSelect('items.storageUnit', 'storageUnit')
      .leftJoinAndSelect('items.bag', 'itemBag')
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

  async findPendingCollectionReminders(): Promise<CollectionRequest[]> {
    const repository = await this.getRepository();
    return repository
      .createQueryBuilder('collectionRequest')
      .innerJoinAndSelect('collectionRequest.route', 'route')
      // innerJoin: sem utilizador não há destinatário para o lembrete.
      .innerJoinAndSelect('collectionRequest.user', 'user')
      .leftJoinAndSelect('collectionRequest.address', 'address')
      .where('route.status IN (:...routeStatuses)', {
        routeStatuses: [RouteStatus.WAITING_TO_START, RouteStatus.IN_TRANSIT],
      })
      // A confirmação do cliente é o critério canónico, não o status: numa rota
      // já IN_TRANSIT os pedidos foram movidos para WAITING_FOR_COLLECTION.
      .andWhere('collectionRequest.collectionConfirmedAt IS NOT NULL')
      .andWhere('collectionRequest.collectionReminderSentAt IS NULL')
      .andWhere('collectionRequest.status NOT IN (:...excludedStatuses)', {
        excludedStatuses: [
          CollectionRequestStatus.CANCELLED,
          CollectionRequestStatus.COLLECTED,
        ],
      })
      .andWhere("route.start_date::date = CURRENT_DATE + INTERVAL '1 day'")
      .getMany();
  }
}
