import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { UseCasesModule } from '../app/use-cases/use-cases.module';
import { HealthController } from './health/health.controller';
import { PackageController } from './package/package.controller';
import { StorageUnitController } from './storage-unit/storage-unit.controller';
import { UserController } from './user/user.controller';
import { WelcomeController } from './welcome/welcome.controller';

@Module({
  imports: [
    UseCasesModule,
    TerminusModule,
  ],
  controllers: [
    WelcomeController,
    UserController,
    HealthController,
    PackageController,
    StorageUnitController
  ],
})
export class ApiModule { }
