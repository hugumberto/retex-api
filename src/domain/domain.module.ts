import { DynamicModule, ForwardReference, Type } from '@nestjs/common';
import { ITestZoneRepository } from './test-zone/test-zone.repository';
import { DOMAIN_TOKENS } from './tokens';
import { IUserRepository } from './user/user.repository';

export interface DomainModuleOptions {
  userRepository: Type<IUserRepository>;
  testZoneRepository: Type<ITestZoneRepository>;
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
      ],
    };
  }
}
