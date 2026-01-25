import { Module } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { ClsModule } from 'nestjs-cls';
import { LOCAL_STORAGE_TOKENS } from './token';

@Module({
  imports: [ClsModule.forRoot({})],
  providers: [
    {
      provide: LOCAL_STORAGE_TOKENS.CLS_SERVICE,
      useValue: new AsyncLocalStorage(),
    },
  ],
  exports: [ClsModule, ...Object.values(LOCAL_STORAGE_TOKENS)],
})
export class LocalStorageModule {}
