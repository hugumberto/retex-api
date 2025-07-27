import { DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino/LoggerModule';
import { ApiModule } from './api/api.module';
import { ServicesModule } from './app/services/services.module';
import { UseCasesModule } from './app/use-cases/use-cases.module';
import { getConfigValidation } from './config/config.schema';
import { getLoggerConfig } from './config/logger.config';
import { DomainModule } from './domain/domain.module';
import { BrandRepository } from './infrastructure/data/typeorm/brand/brand.repository';
import { ItemRepository } from './infrastructure/data/typeorm/item/item.repository';
import { PackageRepository } from './infrastructure/data/typeorm/package/package.repository';
import { RouteRepository } from './infrastructure/data/typeorm/route/route.repository';
import { StorageUnitRepository } from './infrastructure/data/typeorm/storage-unit/storage-unit.repository';
import { TestZoneRepository } from './infrastructure/data/typeorm/test-zone/test-zone.repository';
import { AppTypeORMModule } from './infrastructure/data/typeorm/typeorm.module';
import { UserRoleRepository } from './infrastructure/data/typeorm/user-role/user-role.repository';
import { UserRepository } from './infrastructure/data/typeorm/user/user.repository';
import { SanitizationService } from './infrastructure/services/sanitization/sanitization.service';

export class AppModule {
  static register(): DynamicModule {
    const imports = [
      ConfigModule.forRoot({
        validate: getConfigValidation,
        ignoreEnvVars: process.env.NODE_ENV === 'development',
      }),
      UseCasesModule.register(),
      DomainModule.register({
        userRepository: UserRepository,
        testZoneRepository: TestZoneRepository,
        brandRepository: BrandRepository,
        itemRepository: ItemRepository,
        packageRepository: PackageRepository,
        routeRepository: RouteRepository,
        storageUnitRepository: StorageUnitRepository,
        userRoleRepository: UserRoleRepository,
        imports: [AppTypeORMModule],
      }),
      ServicesModule.register({
        sanitizationService: SanitizationService,
      }),
      ApiModule,
    ];

    if (process.env.NODE_ENV !== 'test') {
      imports.push(
        LoggerModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => {
            return getLoggerConfig(configService);
          },
        }),
      );
    }

    return {
      module: AppModule,
      imports: imports,
    };
  }
}
