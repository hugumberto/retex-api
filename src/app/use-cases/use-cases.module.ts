import { DynamicModule } from '@nestjs/common';
import { DomainModule } from '../../domain/domain.module';
import { AuthModule } from '../services/auth/auth.module';
import { ServicesModule } from '../services/services.module';
import { AUTH_USE_CASES } from './auth';
import { BRAND_USE_CASES } from './brand';
import { PACKAGE_USE_CASES } from './package';
import { ROUTE_USE_CASES } from './route';
import { STORAGE_UNIT_USE_CASES } from './storage-unit';
import { USER_USE_CASES } from './user';
import { WELCOME_USE_CASES } from './welcome';

export class UseCasesModule {
  static register(): DynamicModule {
    const providers = [
      ...WELCOME_USE_CASES,
      ...USER_USE_CASES,
      ...AUTH_USE_CASES,
      ...PACKAGE_USE_CASES,
      ...ROUTE_USE_CASES,
      ...STORAGE_UNIT_USE_CASES,
      ...BRAND_USE_CASES
    ];

    return {
      module: UseCasesModule,
      global: true,
      imports: [
        DomainModule,
        ServicesModule,
        AuthModule,
      ],
      providers,
      exports: providers,
    };
  }
}
