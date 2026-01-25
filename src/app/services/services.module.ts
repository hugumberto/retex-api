import { DynamicModule, ForwardReference, Type } from '@nestjs/common';
import { CryptoService } from './crypto/crypto.service';
import { ISanitizationService } from './interfaces/sanitization.interface';
import { ILocalStorageService } from './local-storage/local-storage.service';
import { SERVICE_TOKENS } from './tokens';

export interface ServicesModuleOptions {
  sanitizationService: Type<ISanitizationService>;
  localStorageService: Type<ILocalStorageService>;
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
        {
          provide: SERVICE_TOKENS.CRYPTO_SERVICE,
          useClass: CryptoService,
        },
        {
          provide: SERVICE_TOKENS.LOCAL_STORAGE_SERVICE,
          useClass: options.localStorageService,
        }
      ],
      exports: [...Object.values(SERVICE_TOKENS)],
    };
  }
} 