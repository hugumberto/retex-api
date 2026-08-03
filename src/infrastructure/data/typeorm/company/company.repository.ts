import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { ILocalStorageService } from '../../../../app/services/local-storage/local-storage.service';
import { SERVICE_TOKENS } from '../../../../app/services/tokens';
import { CompanyMember } from '../../../../domain/company/company-member.entity';
import { CompanyProfile } from '../../../../domain/company/company-profile.entity';
import { Company } from '../../../../domain/company/company.entity';
import {
  CompanyFilters,
  ICompanyMemberRepository,
  ICompanyProfileRepository,
  ICompanyRepository,
} from '../../../../domain/company/company.repository';
import {
  PaginatedResult,
  PaginationParams,
} from '../../../../domain/interfaces/pagination.interface';
import { BaseRepository } from '../abstraction/base.repository';
import { companyMemberSchema } from './company-member.schema';
import { companyProfileSchema } from './company-profile.schema';
import { companySchema } from './company.schema';

@Injectable()
export class CompanyRepository
  extends BaseRepository<Company>
  implements ICompanyRepository
{
  constructor(
    @InjectRepository(companySchema)
    companyRepository: Repository<Company>,
    @Inject(SERVICE_TOKENS.LOCAL_STORAGE_SERVICE)
    localStorageService: ILocalStorageService,
  ) {
    super(companyRepository, localStorageService);
  }

  async findByFiltersWithPagination(
    filters: CompanyFilters,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<Company>> {
    const repository = await this.getRepository();
    const queryBuilder = repository.createQueryBuilder('company');

    if (filters.status) {
      queryBuilder.andWhere('company.status = :status', {
        status: filters.status,
      });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(company.name ILIKE :search OR company.legal_name ILIKE :search OR company.tax_id ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    const offset = (pagination.page - 1) * pagination.limit;
    queryBuilder
      .skip(offset)
      .take(pagination.limit)
      .orderBy('company.createdAt', 'DESC');

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }
}

@Injectable()
export class CompanyProfileRepository
  extends BaseRepository<CompanyProfile>
  implements ICompanyProfileRepository
{
  constructor(
    @InjectRepository(companyProfileSchema)
    companyProfileRepository: Repository<CompanyProfile>,
    @Inject(SERVICE_TOKENS.LOCAL_STORAGE_SERVICE)
    localStorageService: ILocalStorageService,
  ) {
    super(companyProfileRepository, localStorageService);
  }

  // Perfis de sistema (company_id NULL) mais os próprios da empresa.
  async findAvailableForCompany(companyId: string): Promise<CompanyProfile[]> {
    const repository = await this.getRepository();
    return repository.find({
      where: [{ companyId: IsNull() }, { companyId }] as any,
      order: { name: 'ASC' } as any,
    });
  }

  async findByKey(key: string): Promise<CompanyProfile> {
    const repository = await this.getRepository();
    return repository.findOne({
      where: { key, companyId: IsNull() } as any,
    });
  }
}

@Injectable()
export class CompanyMemberRepository
  extends BaseRepository<CompanyMember>
  implements ICompanyMemberRepository
{
  constructor(
    @InjectRepository(companyMemberSchema)
    companyMemberRepository: Repository<CompanyMember>,
    @Inject(SERVICE_TOKENS.LOCAL_STORAGE_SERVICE)
    localStorageService: ILocalStorageService,
  ) {
    super(companyMemberRepository, localStorageService);
  }

  async findByUserWithRelations(userId: string): Promise<CompanyMember> {
    const repository = await this.getRepository();
    return repository.findOne({
      where: { userId } as any,
      relations: ['company', 'profile'],
    });
  }

  async findByCompanyWithRelations(
    companyId: string,
  ): Promise<CompanyMember[]> {
    const repository = await this.getRepository();
    return repository.find({
      where: { companyId } as any,
      relations: ['user', 'profile'],
      order: { createdAt: 'ASC' } as any,
    });
  }
}
