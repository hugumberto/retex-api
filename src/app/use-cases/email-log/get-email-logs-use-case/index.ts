import { Inject, Injectable } from '@nestjs/common';
import { EmailLog } from '../../../../domain/email-log/email-log.entity';
import { IEmailLogRepository } from '../../../../domain/email-log/email-log.repository';
import { PaginatedResult } from '../../../../domain/interfaces/pagination.interface';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { GetEmailLogsDto } from './get-email-logs.dto';

@Injectable()
export class GetEmailLogsUseCase
  implements IUseCase<GetEmailLogsDto, PaginatedResult<EmailLog>>
{
  constructor(
    @Inject(DOMAIN_TOKENS.EMAIL_LOG_REPOSITORY)
    private readonly emailLogRepository: IEmailLogRepository,
  ) {}

  async call(param: GetEmailLogsDto): Promise<PaginatedResult<EmailLog>> {
    const filters = {
      type: param.type,
      userId: param.userId,
      recipient: param.recipient,
      from: param.from ? new Date(param.from) : undefined,
      to: param.to ? new Date(param.to) : undefined,
    };

    const pagination = {
      page: param.page || 1,
      limit: param.limit || 20,
    };

    return this.emailLogRepository.findByFiltersWithPagination(
      filters,
      pagination,
    );
  }
}
