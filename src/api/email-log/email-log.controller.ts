import { Controller, Get, Query } from '@nestjs/common';
import { GetEmailLogsUseCase } from '../../app/use-cases/email-log/get-email-logs-use-case';
import { GetEmailLogsDto } from '../../app/use-cases/email-log/get-email-logs-use-case/get-email-logs.dto';
import { Role } from '../../domain/user/user-roles.entity';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('email-log')
@Roles(Role.ADMIN)
export class EmailLogController {
  constructor(
    private readonly getEmailLogsUseCase: GetEmailLogsUseCase,
  ) {}

  @Get()
  getEmailLogs(@Query() query: GetEmailLogsDto) {
    return this.getEmailLogsUseCase.call(query);
  }
}
