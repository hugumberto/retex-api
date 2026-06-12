import { DynamicModule } from '@nestjs/common';
import { DomainModule } from '../../domain/domain.module';
import { AuthModule } from '../services/auth/auth.module';
import { ServicesModule } from '../services/services.module';
import { AUTH_USE_CASES } from './auth';
import { BLOG_POST_USE_CASES } from './blog-post';
import { BRAND_USE_CASES } from './brand';
import { ITEM_USE_CASES } from './item/item.use-cases';
import { PACKAGE_USE_CASES } from './package';
import { ROUTE_USE_CASES } from './route';
import { STORAGE_UNIT_USE_CASES } from './storage-unit';
import { USER_USE_CASES } from './user';
import { VISION_USE_CASES } from './vision';
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
      ...BRAND_USE_CASES,
      ...ITEM_USE_CASES,
      ...BLOG_POST_USE_CASES,
      ...VISION_USE_CASES,
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
