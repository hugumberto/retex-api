import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ILocalStorageService } from '../../../../app/services/local-storage/local-storage.service';
import { SERVICE_TOKENS } from '../../../../app/services/tokens';
import { EmailLog } from '../../../../domain/email-log/email-log.entity';
import {
  EmailLogFilters,
  IEmailLogRepository,
} from '../../../../domain/email-log/email-log.repository';
import { PaginatedResult, PaginationParams } from '../../../../domain/interfaces/pagination.interface';
import { BaseRepository } from '../abstraction/base.repository';
import { emailLogSchema } from './email-log.schema';

@Injectable()
export class EmailLogRepository
  extends BaseRepository<EmailLog>
  implements IEmailLogRepository
{
  constructor(
    @InjectRepository(emailLogSchema)
    emailLogRepository: Repository<EmailLog>,
    @Inject(SERVICE_TOKENS.LOCAL_STORAGE_SERVICE)
    localStorageService: ILocalStorageService,
  ) {
    super(emailLogRepository, localStorageService);
  }

  async findByFiltersWithPagination(
    filters: EmailLogFilters,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<EmailLog>> {
    const repository = await this.getRepository();
    const qb = repository.createQueryBuilder('email_log');

    if (filters.type) {
      qb.andWhere('email_log.type = :type', { type: filters.type });
    }
    if (filters.userId) {
      qb.andWhere('email_log.userId = :userId', { userId: filters.userId });
    }
    if (filters.recipient) {
      qb.andWhere('email_log.recipient ILIKE :recipient', {
        recipient: `%${filters.recipient}%`,
      });
    }
    if (filters.from) {
      qb.andWhere('email_log.sentAt >= :from', { from: filters.from });
    }
    if (filters.to) {
      qb.andWhere('email_log.sentAt <= :to', { to: filters.to });
    }

    const offset = (pagination.page - 1) * pagination.limit;
    qb.skip(offset).take(pagination.limit);
    qb.orderBy('email_log.sentAt', 'DESC');

    const [data, total] = await qb.getManyAndCount();
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
}
