import { PaginatedResult, PaginationParams } from '../interfaces/pagination.interface';
import { IRepository } from '../interfaces/repository.interface';
import { EmailLog } from './email-log.entity';

export interface EmailLogFilters {
  type?: string;
  userId?: string;
  // Filtro por email do destinatário (match parcial).
  recipient?: string;
  from?: Date;
  to?: Date;
}

export interface IEmailLogRepository extends IRepository<EmailLog> {
  findByFiltersWithPagination(
    filters: EmailLogFilters,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<EmailLog>>;
}
