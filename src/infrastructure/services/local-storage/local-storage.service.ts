import { Inject } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { ILocalStorageService } from '../../../app/services/local-storage/local-storage.service';
import { LOCAL_STORAGE_TOKENS } from './token';

export class LocalStorageService implements ILocalStorageService {
  constructor(
    @Inject(LOCAL_STORAGE_TOKENS.CLS_SERVICE)
    private readonly asyncLocalStorage: AsyncLocalStorage<any>,
  ) { }

  async init<T>(fn: () => Promise<T>): Promise<T> {
    return this.asyncLocalStorage.run({}, async () => {
      return fn();
    });
  }

  async set(data: Record<string, any>, override = true): Promise<void> {
    const store = await this.asyncLocalStorage.getStore();

    Object.keys(data ?? {}).forEach((key) => {
      if (override || !store[key]) {
        store[key] = data[key];
      }
    });
  }

  async get<T = any>(): Promise<T> {
    const store = await this.asyncLocalStorage.getStore();
    return store as T;
  }
}
