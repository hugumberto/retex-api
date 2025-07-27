import { DynamicModule, ForwardReference, Type } from '@nestjs/common';
import { IBrandRepository } from './brand/brand.repository';
import { IItemRepository } from './item/item.repository';
import { IPackageRepository } from './package/package.repository';
import { IRouteRepository } from './route/route.repository';
import { IStorageUnitRepository } from './storage-unit/storage-unit.repository';
import { ITestZoneRepository } from './test-zone/test-zone.repository';
import { DOMAIN_TOKENS } from './tokens';
import { IUserRoleRepository } from './user/user-role.repository';
import { IUserRepository } from './user/user.repository';

export interface DomainModuleOptions {
  userRepository: Type<IUserRepository>;
  testZoneRepository: Type<ITestZoneRepository>;
  brandRepository: Type<IBrandRepository>;
  itemRepository: Type<IItemRepository>;
  packageRepository: Type<IPackageRepository>;
  routeRepository: Type<IRouteRepository>;
  storageUnitRepository: Type<IStorageUnitRepository>;
  userRoleRepository: Type<IUserRoleRepository>;
  imports?: Array<
    Type<any> | DynamicModule | Promise<DynamicModule> | ForwardReference
  >;
}

export class DomainModule {
  static register(options: DomainModuleOptions): DynamicModule {
    return {
      module: DomainModule,
      global: true,
      imports: options.imports || [],
      providers: [
        {
          provide: DOMAIN_TOKENS.USER_REPOSITORY,
          useClass: options.userRepository,
        },
        {
          provide: DOMAIN_TOKENS.TEST_ZONE_REPOSITORY,
          useClass: options.testZoneRepository,
        },
        {
          provide: DOMAIN_TOKENS.BRAND_REPOSITORY,
          useClass: options.brandRepository,
        },
        {
          provide: DOMAIN_TOKENS.ITEM_REPOSITORY,
          useClass: options.itemRepository,
        },
        {
          provide: DOMAIN_TOKENS.PACKAGE_REPOSITORY,
          useClass: options.packageRepository,
        },
        {
          provide: DOMAIN_TOKENS.ROUTE_REPOSITORY,
          useClass: options.routeRepository,
        },
        {
          provide: DOMAIN_TOKENS.STORAGE_UNIT_REPOSITORY,
          useClass: options.storageUnitRepository,
        },
        {
          provide: DOMAIN_TOKENS.USER_ROLE_REPOSITORY,
          useClass: options.userRoleRepository,
        },
      ],
      exports: [
        {
          provide: DOMAIN_TOKENS.USER_REPOSITORY,
          useClass: options.userRepository,
        },
        {
          provide: DOMAIN_TOKENS.TEST_ZONE_REPOSITORY,
          useClass: options.testZoneRepository,
        },
        {
          provide: DOMAIN_TOKENS.BRAND_REPOSITORY,
          useClass: options.brandRepository,
        },
        {
          provide: DOMAIN_TOKENS.ITEM_REPOSITORY,
          useClass: options.itemRepository,
        },
        {
          provide: DOMAIN_TOKENS.PACKAGE_REPOSITORY,
          useClass: options.packageRepository,
        },
        {
          provide: DOMAIN_TOKENS.ROUTE_REPOSITORY,
          useClass: options.routeRepository,
        },
        {
          provide: DOMAIN_TOKENS.STORAGE_UNIT_REPOSITORY,
          useClass: options.storageUnitRepository,
        },
        {
          provide: DOMAIN_TOKENS.USER_ROLE_REPOSITORY,
          useClass: options.userRoleRepository,
        },
      ],
    };
  }
}
