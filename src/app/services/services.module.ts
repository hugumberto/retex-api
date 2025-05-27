import { DynamicModule, ForwardReference, Type } from '@nestjs/common';
import { ISanitizationService } from './interfaces/sanitization.interface';
import { SERVICE_TOKENS } from './tokens';

export interface ServicesModuleOptions {
  sanitizationService: Type<ISanitizationService>;
  imports?: Array<
    Type<any> | DynamicModule | Promise<DynamicModule> | ForwardReference
  >;
}

export class ServicesModule {
  static register(options: ServicesModuleOptions): DynamicModule {
    return {
      module: ServicesModule,
      global: true,
      imports: options.imports || [],
      providers: [
        {
          provide: SERVICE_TOKENS.SANITIZATION_SERVICE,
          useClass: options.sanitizationService,
        },
      ],
      exports: [...Object.values(SERVICE_TOKENS)],
    };
  }
} 