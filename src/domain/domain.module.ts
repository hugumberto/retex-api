import { DynamicModule, ForwardReference, Type } from '@nestjs/common';
import { IAddressRepository } from './address/address.repository';
import { IBlogPostRepository } from './blog-post/blog-post.repository';
import { IBrandRepository } from './brand/brand.repository';
import { IFaqCategoryRepository } from './faq/faq-category.repository';
import { IFaqItemRepository } from './faq/faq-item.repository';
import { IUnitOfWork } from './interfaces/unit-of-work.interface';
import { IItemRepository } from './item/item.repository';
import { IPackageRepository } from './package/package.repository';
import { IRouteRepository } from './route/route.repository';
import { IStorageUnitRepository } from './storage-unit/storage-unit.repository';
import { ITestZoneRepository } from './test-zone/test-zone.repository';
import { DOMAIN_TOKENS } from './tokens';
import { IRefreshTokenRepository } from './user/refresh-token.repository';
import { IUserRoleRepository } from './user/user-role.repository';
import { IUserRepository } from './user/user.repository';

export interface DomainModuleOptions {
  userRepository: Type<IUserRepository>;
  addressRepository: Type<IAddressRepository>;
  testZoneRepository: Type<ITestZoneRepository>;
  brandRepository: Type<IBrandRepository>;
  itemRepository: Type<IItemRepository>;
  packageRepository: Type<IPackageRepository>;
  routeRepository: Type<IRouteRepository>;
  storageUnitRepository: Type<IStorageUnitRepository>;
  userRoleRepository: Type<IUserRoleRepository>;
  refreshTokenRepository: Type<IRefreshTokenRepository>;
  blogPostRepository: Type<IBlogPostRepository>;
  faqCategoryRepository: Type<IFaqCategoryRepository>;
  faqItemRepository: Type<IFaqItemRepository>;
  unitOfWork: Type<IUnitOfWork>;
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
          provide: DOMAIN_TOKENS.ADDRESS_REPOSITORY,
          useClass: options.addressRepository,
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
        {
          provide: DOMAIN_TOKENS.REFRESH_TOKEN_REPOSITORY,
          useClass: options.refreshTokenRepository,
        },
        {
          provide: DOMAIN_TOKENS.BLOG_POST_REPOSITORY,
          useClass: options.blogPostRepository,
        },
        {
          provide: DOMAIN_TOKENS.FAQ_CATEGORY_REPOSITORY,
          useClass: options.faqCategoryRepository,
        },
        {
          provide: DOMAIN_TOKENS.FAQ_ITEM_REPOSITORY,
          useClass: options.faqItemRepository,
        },
        {
          provide: DOMAIN_TOKENS.UNIT_OF_WORK,
          useClass: options.unitOfWork,
        },
      ],
      exports: [
        {
          provide: DOMAIN_TOKENS.USER_REPOSITORY,
          useClass: options.userRepository,
        },
        {
          provide: DOMAIN_TOKENS.ADDRESS_REPOSITORY,
          useClass: options.addressRepository,
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
        {
          provide: DOMAIN_TOKENS.REFRESH_TOKEN_REPOSITORY,
          useClass: options.refreshTokenRepository,
        },
        {
          provide: DOMAIN_TOKENS.BLOG_POST_REPOSITORY,
          useClass: options.blogPostRepository,
        },
        {
          provide: DOMAIN_TOKENS.FAQ_CATEGORY_REPOSITORY,
          useClass: options.faqCategoryRepository,
        },
        {
          provide: DOMAIN_TOKENS.FAQ_ITEM_REPOSITORY,
          useClass: options.faqItemRepository,
        },
        {
          provide: DOMAIN_TOKENS.UNIT_OF_WORK,
          useClass: options.unitOfWork,
        },
      ],
    };
  }
}
