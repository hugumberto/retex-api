import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { ILocalStorageService } from '../../../../app/services/local-storage/local-storage.service';
import { SERVICE_TOKENS } from '../../../../app/services/tokens';
import { Role } from '../../../../domain/user/user-roles.entity';
import { UserStatus } from '../../../../domain/user/user-status.enum';
import { User } from '../../../../domain/user/user.entity';
import {
  DirectoryEntry,
  DirectoryKind,
  DirectoryPage,
  DirectoryQuery,
  IUserRepository,
} from '../../../../domain/user/user.repository';
import { BaseRepository } from '../abstraction/base.repository';
import { userSchema } from './user.schema';

@Injectable()
export class UserRepository
  extends BaseRepository<User>
  implements IUserRepository {
  constructor(
    @InjectRepository(userSchema)
    userRepository: Repository<User>,
    @Inject(SERVICE_TOKENS.LOCAL_STORAGE_SERVICE)
    localStorageService: ILocalStorageService,
  ) {
    super(userRepository, localStorageService);
  }

  async touchLastLogin(userId: string): Promise<void> {
    const repository = await this.getRepository();
    await repository.manager.query(`UPDATE "user" SET last_login_at = now() WHERE id = $1`, [userId]);
  }

  /**
   * Utilizadores: pessoas (particulares, motoristas, equipa) e entidades
   * (empresas, municípios…) numa só lista. Filtra e pagina primeiro sobre uma
   * base leve; as contagens (recolhas, kg, última atividade) só se calculam
   * para as linhas da página.
   */
  async directory({ kind, q, limit, offset }: DirectoryQuery): Promise<DirectoryPage> {
    const repository = await this.getRepository();
    const run = <T>(sql: string, params: unknown[]): Promise<T[]> => repository.manager.query(sql, params);
    const search = q?.trim() ? `%${q.trim().toLowerCase()}%` : null;

    const base = `
      WITH roles AS (
        SELECT user_id, array_agg(DISTINCT role::text) AS roles
          FROM user_role WHERE deleted_at IS NULL GROUP BY user_id
      ),
      base AS (
        -- Quem conduz aparece em Motoristas, mesmo que também seja da equipa.
        SELECT CASE
                 WHEN r.roles && ARRAY['DRIVER'] THEN 'DRIVER'
                 WHEN r.roles && ARRAY['OPS','ADMIN','MASTER'] THEN 'TEAM'
                 ELSE 'PERSON'
               END AS kind,
               'user' AS source,
               u.id,
               TRIM(CONCAT(u.first_name, ' ', u.last_name)) AS name,
               LOWER(CONCAT_WS(' ', u.first_name, u.last_name, u.email, u.contact_phone,
                 (SELECT string_agg(a.zip_code, ' ') FROM user_address a
                   WHERE a.user_id = u.id AND a.deleted_at IS NULL))) AS haystack,
               COALESCE(u.last_login_at, u.created_at) AS recency
          FROM "user" u
          LEFT JOIN roles r ON r.user_id = u.id
         WHERE u.deleted_at IS NULL
           -- Membros de uma empresa aparecem na linha da empresa, não como particulares.
           AND (NOT EXISTS (SELECT 1 FROM company_member m WHERE m.user_id = u.id AND m.deleted_at IS NULL)
                OR COALESCE(r.roles && ARRAY['DRIVER','OPS','ADMIN','MASTER'], false))
        UNION ALL
        SELECT CASE WHEN c.kind = 'MUNICIPALITY' THEN 'MUNICIPALITY' ELSE 'COMPANY' END,
               'company',
               c.id,
               c.name,
               LOWER(CONCAT_WS(' ', c.name, c.legal_name, c.tax_id, REPLACE(c.tax_id, ' ', ''), c.email,
                 (SELECT string_agg(a.zip_code, ' ') FROM user_address a
                   WHERE a.company_id = c.id AND a.deleted_at IS NULL))),
               COALESCE((SELECT MAX(cr.created_at) FROM collection_request cr
                          WHERE cr.company_id = c.id AND cr.deleted_at IS NULL), c.created_at)
          FROM company c
         WHERE c.deleted_at IS NULL
      )`;
    const searchFilter = `($1::text IS NULL OR haystack LIKE $1)`;

    const countRows = await run<{ kind: DirectoryKind; n: string }>(
      `${base} SELECT kind, COUNT(*) AS n FROM base WHERE ${searchFilter} GROUP BY kind`,
      [search],
    );
    const counts = { ALL: 0, PERSON: 0, COMPANY: 0, MUNICIPALITY: 0, DRIVER: 0, TEAM: 0 } as DirectoryPage['counts'];
    countRows.forEach((row) => {
      counts[row.kind] = Number(row.n);
      counts.ALL += Number(row.n);
    });

    const page = await run<{ kind: DirectoryKind; source: 'user' | 'company'; id: string }>(
      `${base}
       SELECT kind, source, id FROM base
        WHERE ${searchFilter} AND ($2::text IS NULL OR kind = $2)
        ORDER BY recency DESC NULLS LAST, name
        LIMIT $3 OFFSET $4`,
      [search, kind ?? null, limit, offset],
    );

    const userIds = page.filter((r) => r.source === 'user').map((r) => r.id);
    const companyIds = page.filter((r) => r.source === 'company').map((r) => r.id);
    const done = `('COLLECTED','IN_HOUSE','SCREENING','STOCKED')`;

    const users = userIds.length
      ? await run<Record<string, any>>(
          `SELECT u.id, TRIM(CONCAT(u.first_name, ' ', u.last_name)) AS name, u.email, u.status,
                  u.activation_token IS NOT NULL AS pending, u.last_login_at,
                  COALESCE((SELECT array_agg(DISTINCT ur.role::text) FROM user_role ur
                             WHERE ur.user_id = u.id AND ur.deleted_at IS NULL), '{}') AS roles,
                  (SELECT a.city FROM user_address a
                    WHERE a.user_id = u.id AND a.company_id IS NULL AND a.deleted_at IS NULL
                    ORDER BY a.is_default DESC, a.created_at LIMIT 1) AS city,
                  (SELECT v.plate FROM route rt JOIN vehicle v ON v.id = rt.vehicle_id
                    WHERE rt.driver_id = u.id AND rt.deleted_at IS NULL
                    ORDER BY rt.start_date DESC LIMIT 1) AS plate,
                  (SELECT COUNT(*) FROM collection_request cr
                    WHERE cr.user_id = u.id AND cr.company_id IS NULL AND cr.deleted_at IS NULL
                      AND cr.status <> 'CANCELLED') AS own_count,
                  (SELECT COALESCE(SUM(cr.weight), 0) FROM collection_request cr
                    WHERE cr.user_id = u.id AND cr.company_id IS NULL AND cr.deleted_at IS NULL
                      AND cr.status IN ('SCREENING','STOCKED')) AS own_kg,
                  (SELECT MAX(cr.created_at) FROM collection_request cr
                    WHERE cr.user_id = u.id AND cr.deleted_at IS NULL) AS last_request,
                  (SELECT COUNT(*) FROM collection_request cr JOIN route rt ON rt.id = cr.route_id
                    WHERE rt.driver_id = u.id AND cr.deleted_at IS NULL AND cr.status IN ${done}) AS driven,
                  (SELECT MAX(rt.updated_at) FROM route rt
                    WHERE rt.driver_id = u.id AND rt.deleted_at IS NULL) AS last_route,
                  EXISTS (SELECT 1 FROM route rt WHERE rt.driver_id = u.id
                           AND rt.status = 'IN_TRANSIT' AND rt.deleted_at IS NULL) AS in_route,
                  (SELECT MAX(i.created_at) FROM item i WHERE i.operator_id = u.id) AS last_item
             FROM "user" u WHERE u.id = ANY($1)`,
          [userIds],
        )
      : [];
    const companies = companyIds.length
      ? await run<Record<string, any>>(
          `SELECT c.id, c.name, c.email, c.tax_id, c.kind, c.status,
                  (SELECT COUNT(*) FROM user_address a
                    WHERE a.company_id = c.id AND a.deleted_at IS NULL) AS locations,
                  (SELECT a.city FROM user_address a WHERE a.company_id = c.id AND a.deleted_at IS NULL
                    ORDER BY a.created_at LIMIT 1) AS city,
                  (SELECT COUNT(*) FROM collection_request cr WHERE cr.company_id = c.id
                      AND cr.deleted_at IS NULL AND cr.status <> 'CANCELLED') AS own_count,
                  (SELECT COALESCE(SUM(cr.weight), 0) FROM collection_request cr WHERE cr.company_id = c.id
                      AND cr.deleted_at IS NULL AND cr.status IN ('SCREENING','STOCKED')) AS own_kg,
                  (SELECT MAX(cr.created_at) FROM collection_request cr
                    WHERE cr.company_id = c.id AND cr.deleted_at IS NULL) AS last_request
             FROM company c WHERE c.id = ANY($1)`,
          [companyIds],
        )
      : [];

    const latest = (...dates: (Date | string | null | undefined)[]) => {
      const times = dates.filter(Boolean).map((d) => new Date(d as Date).getTime());
      return times.length ? new Date(Math.max(...times)) : null;
    };

    const data: DirectoryEntry[] = page.map((row) => {
      if (row.source === 'company') {
        const c = companies.find((x) => x.id === row.id) ?? {};
        return {
          kind: row.kind,
          id: row.id,
          name: c.name,
          email: c.email ?? null,
          taxId: c.tax_id ?? null,
          companyKind: c.kind ?? null,
          locations: Number(c.locations ?? 0),
          roles: [],
          plate: null,
          city: c.city ?? null,
          collections: Number(c.own_count ?? 0),
          deliveredKg: Number(c.own_kg ?? 0),
          lastActivityAt: latest(c.last_request),
          inRoute: false,
          status: c.status,
        };
      }
      const u = users.find((x) => x.id === row.id) ?? {};
      const driver = row.kind === 'DRIVER';
      const team = row.kind === 'TEAM';
      return {
        kind: row.kind,
        id: row.id,
        name: u.name,
        email: u.email ?? null,
        taxId: null,
        companyKind: null,
        locations: 0,
        roles: u.roles ?? [],
        plate: u.plate ?? null,
        city: driver || team ? null : u.city ?? null,
        collections: driver ? Number(u.driven ?? 0) : team ? 0 : Number(u.own_count ?? 0),
        deliveredKg: driver || team ? 0 : Number(u.own_kg ?? 0),
        lastActivityAt: latest(u.last_login_at, u.last_request, u.last_route, u.last_item),
        inRoute: !!u.in_route,
        status: u.status === 'ACTIVE' ? 'ACTIVE' : u.pending ? 'PENDING_EMAIL' : 'INACTIVE',
      };
    });

    return { data, total: kind ? counts[kind] : counts.ALL, counts };
  }

  async findOneWithRelations(query: Partial<User>): Promise<User> {
    const repository = await this.getRepository();
    const normalizedQuery = this.normalizeQuery(query);
    return repository.findOne({
      where: normalizedQuery as FindOptionsWhere<User>,
      relations: ['roles'],
    });
  }

  async findWithRelations(query: Partial<User>, options?: { role?: Role }): Promise<User[]> {
    const repository = await this.getRepository();
    const normalizedQuery = this.normalizeQuery(query);

    const where: any = normalizedQuery;

    if (options?.role) {
      where.roles = { role: options.role };
    }

    return repository.find({
      where: where as FindOptionsWhere<User>,
      relations: ['roles', 'addresses'],
    });
  }

  async findInactiveUsersByCity(sanitizedCity: string): Promise<User[]> {
    const repository = await this.getRepository();
    return repository
      .createQueryBuilder('u')
      .innerJoin('user_address', 'a', 'a.user_id = u.id AND a.is_default = true')
      .where('u.status = :status', { status: UserStatus.INACTIVE })
      .andWhere('a.city_normalized = :city', { city: sanitizedCity })
      .getMany();
  }

  // Os tokens têm `select: false` (não vazam em leituras normais); aqui
  // re-incluímos os campos necessários para validar a expiração.
  async findByActivationToken(token: string): Promise<User | null> {
    const repository = await this.getRepository();
    return repository
      .createQueryBuilder('u')
      .addSelect(['u.activationToken', 'u.activationTokenExpiresAt'])
      .where('u.activationToken = :token', { token })
      .getOne();
  }

  async findByResetToken(token: string): Promise<User | null> {
    const repository = await this.getRepository();
    return repository
      .createQueryBuilder('u')
      .addSelect(['u.resetTokenExpiresAt'])
      .where('u.resetToken = :token', { token })
      .getOne();
  }

  async countAll(): Promise<number> {
    const repository = await this.getRepository();
    return repository.count();
  }

  async countByStatus(status: UserStatus): Promise<number> {
    const repository = await this.getRepository();
    return repository.count({
      where: { status } as FindOptionsWhere<User>,
    });
  }
}
