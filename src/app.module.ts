import { DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino/LoggerModule';
import { ApiModule } from './api/api.module';
import { SeedModule } from './app/services/seed/seed.module';
import { ServicesModule } from './app/services/services.module';
import { UseCasesModule } from './app/use-cases/use-cases.module';
import { getConfigValidation } from './config/config.schema';
import { getLoggerConfig } from './config/logger.config';
import { DomainModule } from './domain/domain.module';
import { TypeORMUnitOfWork } from './infrastructure/data/typeorm/abstraction/unit-of-work';
import { BlogPostRepository } from './infrastructure/data/typeorm/blog-post/blog-post.repository';
import { BrandRepository } from './infrastructure/data/typeorm/brand/brand.repository';
import { ItemRepository } from './infrastructure/data/typeorm/item/item.repository';
import { PackageRepository } from './infrastructure/data/typeorm/package/package.repository';
import { RouteRepository } from './infrastructure/data/typeorm/route/route.repository';
import { StorageUnitRepository } from './infrastructure/data/typeorm/storage-unit/storage-unit.repository';
import { TestZoneRepository } from './infrastructure/data/typeorm/test-zone/test-zone.repository';
import { AppTypeORMModule } from './infrastructure/data/typeorm/typeorm.module';
import { UserRoleRepository } from './infrastructure/data/typeorm/user-role/user-role.repository';
import { RefreshTokenRepository } from './infrastructure/data/typeorm/user/refresh-token.repository';
import { UserRepository } from './infrastructure/data/typeorm/user/user.repository';
import { LocalStorageModule } from './infrastructure/services/local-storage/local-storage.module';
import { LocalStorageService } from './infrastructure/services/local-storage/local-storage.service';
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
        refreshTokenRepository: RefreshTokenRepository,
        blogPostRepository: BlogPostRepository,
        unitOfWork: TypeORMUnitOfWork,
        imports: [AppTypeORMModule],
      }),
      ServicesModule.register({
        sanitizationService: SanitizationService,
        localStorageService: LocalStorageService,
        imports: [LocalStorageModule],
      }),
      ApiModule,
    ];

    if (process.env.NODE_ENV === 'development') {
      imports.push(SeedModule);
    }

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
