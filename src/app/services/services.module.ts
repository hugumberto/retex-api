import { DynamicModule, ForwardReference, Type } from '@nestjs/common';
import { CompanyContextService } from './company-context/company-context.service';
import { CryptoService } from './crypto/crypto.service';
import { IEmailService } from './interfaces/email.interface';
import { IGeocodingService } from './interfaces/geocoding.interface';
import { ISanitizationService } from './interfaces/sanitization.interface';
import { ILocalStorageService } from './local-storage/local-storage.service';
import { SERVICE_TOKENS } from './tokens';

export interface ServicesModuleOptions {
  sanitizationService: Type<ISanitizationService>;
  localStorageService: Type<ILocalStorageService>;
  emailService: Type<IEmailService>;
  geocodingService: Type<IGeocodingService>;
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
        },
        {
          provide: SERVICE_TOKENS.EMAIL_SERVICE,
          useClass: options.emailService,
        },
        {
          provide: SERVICE_TOKENS.GEOCODING_SERVICE,
          useClass: options.geocodingService,
        },
        // Classe concreta (não token): depende só do repositório de membros,
        // que vem do DomainModule global.
        CompanyContextService,
      ],
      exports: [...Object.values(SERVICE_TOKENS), CompanyContextService],
    };
  }
} 