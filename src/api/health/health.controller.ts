import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { Public } from '../auth/decorators/public.decorator';

@Controller('health')
@Public()
export class HealthController {
  constructor(
    private healthService: HealthCheckService,
    private typeOrmHealthIndicator: TypeOrmHealthIndicator,
  ) {}

  @Get()
  check() {
    return this.healthService.check([
      () => this.typeOrmHealthIndicator.pingCheck('postgres'),
    ]);
  }
}
