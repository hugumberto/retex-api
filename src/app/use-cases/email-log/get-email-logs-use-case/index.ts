import { Inject, Injectable } from '@nestjs/common';
import { EmailLog } from '../../../../domain/email-log/email-log.entity';
import { IEmailLogRepository } from '../../../../domain/email-log/email-log.repository';
import { PaginatedResult } from '../../../../domain/interfaces/pagination.interface';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { GetEmailLogsDto } from './get-email-logs.dto';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

// Converte o filtro de data. Se vier só o dia (YYYY-MM-DD), ancora ao início ou
// ao fim do dia (UTC) para que o intervalo [from, to] seja inclusivo.
function parseDate(
  value: string | undefined,
  boundary: 'start' | 'end',
): Date | undefined {
  if (!value) return undefined;
  if (DATE_ONLY.test(value)) {
    const suffix = boundary === 'start' ? 'T00:00:00.000Z' : 'T23:59:59.999Z';
    return new Date(`${value}${suffix}`);
  }
  return new Date(value);
}

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
      // Datas só com dia (YYYY-MM-DD) são normalizadas para o início (from) e o
      // fim (to) do dia em UTC, tornando o intervalo inclusivo.
      from: parseDate(param.from, 'start'),
      to: parseDate(param.to, 'end'),
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
